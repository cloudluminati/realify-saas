import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");

  const supabase = await getSupabaseServer();

  const { data: images } = await supabase
    .from("image_generation_history")
    .select("id,image_url,prompt,created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    images: images || []
  });

}
