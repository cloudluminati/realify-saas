import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// ⭐ FINAL SUBSCRIPTION UNITS
const PLAN_UNITS: Record<string, number> = {
  starter: 200,
  creator: 750,
};

// ⭐ BUNDLE CREDIT AMOUNTS (LOCKED)
const BUNDLE_UNITS: Record<string, number> = {
  small: 100,
  medium: 200,
  large: 300,
};

// ⭐ PRICE → PLAN MAP
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER || '']: 'starter',
  [process.env.STRIPE_PRICE_CREATOR || '']: 'creator',
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safePlan(plan: any): 'starter' | 'creator' | null {
  if (plan === 'starter' || plan === 'creator') return plan;
  return null;
}

async function stackUnitsForUser(
  userId: string,
  plan: string,
  addUnits: number,
  stripeCustomerId?: string
) {
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingSub) {
    const newRemaining =
      Number(existingSub.units_remaining || 0) + addUnits;

    const newTotal =
      Number(existingSub.units_total || 0) + addUnits;

    await supabase
      .from('subscriptions')
      .update({
        plan,
        status: 'active',
        ...(stripeCustomerId && {
          stripe_customer_id: stripeCustomerId,
        }),
        units_total: newTotal,
        units_remaining: newRemaining,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    console.log('✅ Credits stacked:', userId, newRemaining);
  } else {
    await supabase.from('subscriptions').insert({
      user_id: userId,
      ...(stripeCustomerId && {
        stripe_customer_id: stripeCustomerId,
      }),
      plan,
      status: 'active',
      units_total: addUnits,
      units_remaining: addUnits,
    });

    console.log('✅ New subscription row created');
  }
}

async function getPlanFromInvoice(invoice: Stripe.Invoice) {
  const line = invoice.lines?.data?.[0];
  const priceId = (line?.price as any)?.id as string | undefined;

  if (!priceId) return null;

  return PRICE_TO_PLAN[priceId] || null;
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  const bodyBuffer = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      bodyBuffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('❌ Webhook verify failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    );
  }

  console.log('Stripe webhook:', event.type);

  // ⭐ CHECKOUT COMPLETED
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId =
      session.metadata?.user_id ||
      session.payment_intent?.metadata?.user_id;

    const purchaseType =
      session.metadata?.purchase_type ||
      session.payment_intent?.metadata?.purchase_type;

    const bundle =
      session.metadata?.bundle ||
      session.payment_intent?.metadata?.bundle;

    const customerId = session.customer as string;

    // ⭐ CREDIT BUNDLE PURCHASE
    if (purchaseType === 'credits_bundle' && userId && bundle) {
      const units = BUNDLE_UNITS[bundle];

      if (units) {
        await stackUnitsForUser(
          userId,
          'starter', // plan doesn't matter for bundles
          units,
          customerId
        );
      }

      return NextResponse.json({ received: true });
    }

    // ⭐ SUBSCRIPTION FIRST PURCHASE
    const plan = safePlan(session.metadata?.plan);

    if (plan && userId) {
      const units = PLAN_UNITS[plan];
      await stackUnitsForUser(userId, plan, units, customerId);
    }
  }

  // ⭐ RENEWALS
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;

    if (invoice.billing_reason !== 'subscription_cycle') {
      return NextResponse.json({ received: true });
    }

    const plan = (await getPlanFromInvoice(invoice)) || 'starter';
    const units = PLAN_UNITS[plan];

    const customerId = invoice.customer as string;

    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .limit(1)
      .maybeSingle();

    if (data?.user_id) {
      await stackUnitsForUser(
        data.user_id,
        plan,
        units,
        customerId
      );
    }
  }

  // ⭐ CANCEL SYNC
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;

    await supabase
      .from('subscriptions')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', sub.customer as string);
  }

  return NextResponse.json({ received: true });
}

