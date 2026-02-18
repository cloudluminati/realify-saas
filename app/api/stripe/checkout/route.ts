import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

type Plan = "starter" | "creator";

function safePlan(plan: any): Plan {
  return plan === "creator" ? "creator" : "starter";
}

function getPriceId(plan: Plan) {
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER;
  if (plan === "creator") return process.env.STRIPE_PRICE_CREATOR;
  return undefined;
}

async function findOrCreateCustomer(email: string): Promise<string> {
  // Try to find existing Stripe customer by email
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data?.[0]?.id) return existing.data[0].id;

  // Create new
  const created = await stripe.customers.create({ email });
  return created.id;
}

async function hasActiveSubscription(customerId: string): Promise<boolean> {
  // active/trialing/past_due/unpaid = still “has a subscription” for our purposes
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  return subs.data.some((s) =>
    ["active", "trialing", "past_due", "unpaid"].includes(s.status)
  );
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = safePlan(body.plan);

    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    // Always anchor billing to a single Stripe customer for this email
    const customerId = await findOrCreateCustomer(user.email);

    // ✅ HARD BLOCK duplicate subscription purchases (even if webhook is delayed)
    if (await hasActiveSubscription(customerId)) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: process.env.NEXT_PUBLIC_SITE_URL!,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // First-time subscription checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],

      // Write metadata onto the subscription for invoice.paid handling
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },

      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?upgrade=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("STRIPE CHECKOUT ERROR:", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}

