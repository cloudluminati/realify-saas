import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

async function findOrCreateCustomer(email: string): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data?.[0]?.id) return existing.data[0].id;

  const created = await stripe.customers.create({ email });
  return created.id;
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

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id,status")
      .eq("user_id", user.id)
      .in("status", ["active", "canceling"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 }
      );
    }

    const { bundle } = await req.json().catch(() => ({}));

    let priceId: string | undefined;

    if (bundle === "small") {
      priceId = process.env.STRIPE_PRICE_CREDITS_SMALL;
    } else if (bundle === "medium") {
      priceId = process.env.STRIPE_PRICE_CREDITS_MEDIUM;
    } else if (bundle === "large") {
      priceId = process.env.STRIPE_PRICE_CREDITS_LARGE;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "invalid_bundle" },
        { status: 400 }
      );
    }

    const customerId =
      sub.stripe_customer_id || (await findOrCreateCustomer(user.email));

    if (!sub.stripe_customer_id) {
      await supabase
        .from("subscriptions")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],

      metadata: {
        user_id: user.id,
        purchase_type: "credits_bundle",
        bundle,
      },

      payment_intent_data: {
        metadata: {
          user_id: user.id,
          purchase_type: "credits_bundle",
          bundle,
        },
      },

      allow_promotion_codes: false,

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?credits=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?credits=cancel`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("CREDITS CHECKOUT ERROR:", err);

    return NextResponse.json(
      { error: "checkout_failed" },
      { status: 500 }
    );
  }
}
