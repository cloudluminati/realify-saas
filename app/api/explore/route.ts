import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    const { data: images, error } = await supabase
      .from("image_generation_history")
      .select("id,image_url,prompt,created_at,is_private")
      .eq("is_private", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Explore query error:", error);

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
    console.error("Explore fetch error:", err);

    return NextResponse.json(
      {
        images: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
