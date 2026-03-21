import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; // ✅ VERY IMPORTANT

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("API USER:", user);

    if (!user) {
      return NextResponse.json(
        { active: false, plan: null },
        { headers: { "Cache-Control": "no-store" } } // ✅ force fresh
      );
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .in("status", ["active", "canceling"])
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { active: false, plan: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { active: true, plan: sub.plan },
      { headers: { "Cache-Control": "no-store" } }
    );

  } catch (err) {
    console.error("Subscription status error:", err);

    return NextResponse.json(
      { active: false, plan: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
