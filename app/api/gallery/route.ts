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
      return NextResponse.json({ images: [] });
    }

    const { data: images } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      images: images || [],
    });

  } catch (err) {
    console.error("Gallery fetch error:", err);

    return NextResponse.json({
      images: [],
    });
  }
}

