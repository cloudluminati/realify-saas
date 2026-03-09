import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {

  try {

    const { image_ids } = await req.json();

    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from("image_likes")
      .select("image_id");

    const counts: Record<string, number> = {};

    data?.forEach((like) => {

      counts[like.image_id] =
        (counts[like.image_id] || 0) + 1;
    });

    return NextResponse.json({ counts });

  } catch (err) {

    console.error("Likes count error:", err);

    return NextResponse.json({ counts: {} });
  }
}
