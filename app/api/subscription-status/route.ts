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
      return NextResponse.json({ active: false });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      // ⭐ FIX: include canceling subscriptions too
      .in("status", ["active", "canceling"])
      .maybeSingle();

    return NextResponse.json({ active: !!sub });
  } catch (err) {
    console.error("Subscription status error:", err);
    return NextResponse.json({ active: false });
  }
}

