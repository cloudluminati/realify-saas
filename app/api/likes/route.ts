import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { image_ids } = await req.json();

    if (!Array.isArray(image_ids) || image_ids.length === 0) {
      return NextResponse.json({ counts: {}, liked_ids: [] });
    }

    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: likesData, error: likesError } = await supabase
      .from("image_likes")
      .select("image_id,user_id")
      .in("image_id", image_ids);

    if (likesError) {
      console.error("Likes count error:", likesError);
      return NextResponse.json({ counts: {}, liked_ids: [] });
    }

    const counts: Record<string, number> = {};
    const likedIds = new Set<string>();

    likesData?.forEach((like) => {
      counts[like.image_id] = (counts[like.image_id] || 0) + 1;

      if (user && like.user_id === user.id) {
        likedIds.add(like.image_id);
      }
    });

    return NextResponse.json({
      counts,
      liked_ids: Array.from(likedIds),
    });
  } catch (err) {
    console.error("Likes count error:", err);
    return NextResponse.json({ counts: {}, liked_ids: [] });
  }
}
