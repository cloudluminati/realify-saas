import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { images: [] },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: images, error } = await supabase
      .from("image_generation_history")
      .select("id, user_id, image_url, prompt, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Gallery query error:", error);

      return NextResponse.json(
        { images: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        images: images || [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Gallery fetch error:", err);

    return NextResponse.json(
      {
        images: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
