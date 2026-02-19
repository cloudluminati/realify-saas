import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

// ✅ FIX: Match Stripe SDK expected API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
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
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data?.[0]?.id) return existing.data[0].id;

  const created = await stripe.customers.create({ email });
  return created.id;
}

async function hasActiveSubscription(customerId: string): Promise<boolean> {
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
      return NextResponse.json(
        { error: "not_authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = safePlan(body.plan);

    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: "invalid_plan" },
        { status: 400 }
      );
    }

    const customerId = await findOrCreateCustomer(user.email);

    if (await hasActiveSubscription(customerId)) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: process.env.NEXT_PUBLIC_SITE_URL!,
      });

      return NextResponse.json({ url: portalSession.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],

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
    return NextResponse.json(
      { error: "checkout_failed" },
      { status: 500 }
    );
  }
}

