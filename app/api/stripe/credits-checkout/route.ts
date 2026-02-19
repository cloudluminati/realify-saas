import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();

    // ✅ AUTH CHECK
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "not_authenticated" },
        { status: 401 }
      );
    }

    // ✅ REQUIRE ACTIVE SUBSCRIPTION
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 }
      );
    }

    const { bundle } = await req.json();

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],

      payment_intent_data: {
        metadata: {
          user_id: user.id,
          purchase_type: "credits_bundle",
          bundle,
        },
      },

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

