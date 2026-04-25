import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.identities?.[0]?.identity_data?.full_name ||
      user.identities?.[0]?.identity_data?.name ||
      null;

    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Profile sync error:", error);
      return NextResponse.json({ error: "profile_sync_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile sync route error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
