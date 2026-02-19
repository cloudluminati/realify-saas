import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST() {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "not_authenticated" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id,status,updated_at")
      .eq("user_id", user.id)
      .in("status", ["active", "canceling"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Portal lookup error:", error);
      return NextResponse.json(
        { error: "portal_lookup_failed" },
        { status: 500 }
      );
    }

    if (!data?.stripe_customer_id) {
      return NextResponse.json(
        { error: "no_subscription" },
        { status: 400 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: process.env.NEXT_PUBLIC_SITE_URL!,
    });

    return NextResponse.json({ url: portal.url });

  } catch (err) {
    console.error("Portal error:", err);

    return NextResponse.json(
      { error: "portal_error" },
      { status: 500 }
    );
  }
}

