import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {

    const supabase = await getSupabaseServer();

    const { data: images } = await supabase
      .from("image_generation_history")
      .select("image_url,prompt,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({
      images: images || [],
    });

  } catch (err) {

    console.error("Explore fetch error:", err);

    return NextResponse.json({
      images: [],
    });
  }
}
