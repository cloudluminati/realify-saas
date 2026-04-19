import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const PLAN_UNITS: Record<string, number> = {
  starter: 200,
  creator: 750,
};

const BUNDLE_UNITS: Record<string, number> = {
  small: 100,
  medium: 200,
  large: 300,
};

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER || ""]: "starter",
  [process.env.STRIPE_PRICE_CREATOR || ""]: "creator",
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSubscriptionRowByUser(userId: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

async function getSubscriptionRowByCustomer(customerId: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

async function linkCustomerToUser(
  userId: string,
  stripeCustomerId: string,
  plan?: string
) {
  const existingSub = await getSubscriptionRowByUser(userId);

  if (existingSub) {
    await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        plan: plan || existingSub.plan,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return;
  }

  await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    plan: plan || "starter",
    status: "inactive",
    units_total: 0,
    units_remaining: 0,
  });
}

async function addUnitsToUser(
  userId: string,
  addUnits: number,
  options?: {
    plan?: string;
    stripeCustomerId?: string;
  }
) {
  const existingSub = await getSubscriptionRowByUser(userId);

  if (existingSub) {
    const newRemaining = Number(existingSub.units_remaining || 0) + addUnits;
    const newTotal = Number(existingSub.units_total || 0) + addUnits;

    await supabase
      .from("subscriptions")
      .update({
        plan: options?.plan || existingSub.plan,
        status: "active",
        stripe_customer_id: options?.stripeCustomerId || existingSub.stripe_customer_id,
        units_total: newTotal,
        units_remaining: newRemaining,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return;
  }

  await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_customer_id: options?.stripeCustomerId || null,
    plan: options?.plan || "starter",
    status: "active",
    units_total: addUnits,
    units_remaining: addUnits,
  });
}

async function getPlanFromInvoice(invoice: Stripe.Invoice) {
  const line = invoice.lines?.data?.[0] as any;
  const priceId =
    line?.pricing?.price_details?.price || line?.price?.id;

  if (!priceId) return null;

  return PRICE_TO_PLAN[priceId] || null;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
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
    console.error("Webhook verify failed:", err.message);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  const { data: existingEvent } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log("Duplicate Stripe event ignored:", event.id);
    return NextResponse.json({ received: true });
  }

  await supabase.from("stripe_events").insert({
    id: event.id,
  });

  console.log("Stripe webhook:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const purchaseType = session.metadata?.purchase_type;
    const bundle = session.metadata?.bundle;
    const userId = session.metadata?.user_id || session.client_reference_id || undefined;
    const plan = session.metadata?.plan;
    const customerId =
      typeof session.customer === "string" ? session.customer : undefined;

    if (purchaseType === "subscription" && userId && customerId) {
      await linkCustomerToUser(userId, customerId, plan || undefined);
    }

    if (
      purchaseType === "credits_bundle" &&
      userId &&
      customerId &&
      bundle &&
      session.payment_status === "paid"
    ) {
      const units = BUNDLE_UNITS[bundle];
      if (units) {
        await linkCustomerToUser(userId, customerId);
        await addUnitsToUser(userId, units, {
          stripeCustomerId: customerId,
        });
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    const plan = await getPlanFromInvoice(invoice);
    if (!plan) return NextResponse.json({ received: true });

    const units = PLAN_UNITS[plan];
    const customerId = invoice.customer as string;

    const existingSub = await getSubscriptionRowByCustomer(customerId);
    const userId = existingSub?.user_id;

    if (userId) {
      await addUnitsToUser(userId, units, {
        plan,
        stripeCustomerId: customerId,
      });
    } else {
      console.warn(
        "invoice.payment_succeeded received but no local subscription row matched stripe_customer_id:",
        customerId
      );
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    const nextStatus =
      sub.status === "active" || sub.status === "trialing"
        ? sub.cancel_at_period_end
          ? "canceling"
          : "active"
        : "inactive";

    await supabase
      .from("subscriptions")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;

    await supabase
      .from("subscriptions")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", sub.customer as string);
  }

  return NextResponse.json({ received: true });
}
