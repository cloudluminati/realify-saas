import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

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

async function getOrCreateCustomerForUser(
  userId: string,
  email: string,
  plan: Plan
): Promise<string> {
  const supabase = await getSupabaseServer();

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSub?.stripe_customer_id) {
    return existingSub.stripe_customer_id;
  }

  const customerId = await findOrCreateCustomer(email);

  const { data: anySub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (anySub) {
    await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await supabase.from("subscriptions").insert({
      user_id: userId,
      stripe_customer_id: customerId,
      plan,
      status: "inactive",
      units_total: 0,
      units_remaining: 0,
    });
  }

  return customerId;
}

async function cancelExistingSubscriptions(customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  for (const sub of subs.data) {
    if (["active", "trialing", "past_due", "unpaid"].includes(sub.status)) {
      try {
        await stripe.subscriptions.cancel(sub.id, {
          prorate: false,
          invoice_now: false,
        });
      } catch (err) {
        console.error("SUB CANCEL ERROR:", err);
      }
    }
  }
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

    const customerId = await getOrCreateCustomerForUser(user.id, user.email, plan);

    await cancelExistingSubscriptions(customerId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],

      metadata: {
        user_id: user.id,
        plan,
        purchase_type: "subscription",
      },

      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
          purchase_type: "subscription",
        },
      },

      allow_promotion_codes: false,

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?upgrade=cancel`,
    });

    await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: customerId,
        plan,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error("STRIPE CHECKOUT ERROR:", err);
    return NextResponse.json(
      { error: "checkout_failed" },
      { status: 500 }
    );
  }
}
