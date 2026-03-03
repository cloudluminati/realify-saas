import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        active: false,
        plan: null,
      });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .in("status", ["active", "canceling"])
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({
        active: false,
        plan: null,
      });
    }

    return NextResponse.json({
      active: true,
      plan: sub.plan,
    });
  } catch (err) {
    console.error("Subscription status error:", err);

    return NextResponse.json({
      active: false,
      plan: null,
    });
  }
}
