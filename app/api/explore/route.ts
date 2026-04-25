import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "new";

    const { data: images, error } = await supabase
      .from("image_generation_history")
      .select("id,image_url,prompt,created_at,is_private,user_id")
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

    const safeImages = images || [];
    const imageIds = safeImages.map((img) => img.id).filter(Boolean);

    let likeCounts: Record<string, number> = {};

    if (imageIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from("image_likes")
        .select("image_id")
        .in("image_id", imageIds);

      if (!likesError && likesData) {
        likesData.forEach((like: any) => {
          likeCounts[like.image_id] = (likeCounts[like.image_id] || 0) + 1;
        });
      }
    }

    const userIds = Array.from(new Set(safeImages.map((img) => img.user_id).filter(Boolean)));

    let profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,email")
        .in("id", userIds);

      profiles?.forEach((profile: any) => {
        profileMap[profile.id] = {
          display_name:
            profile.display_name ||
            (profile.email ? String(profile.email).split("@")[0] : null) ||
            null,
          avatar_url: profile.avatar_url || null,
        };
      });
    }

    let mappedImages = safeImages.map((img) => ({
      ...img,
      creator_name: profileMap[img.user_id]?.display_name || "Creator",
      creator_avatar_url: profileMap[img.user_id]?.avatar_url || null,
      like_count: likeCounts[img.id] || 0,
    }));

    if (sort === "liked") {
      mappedImages = mappedImages.sort((a, b) => {
        const likeDiff = (b.like_count || 0) - (a.like_count || 0);
        if (likeDiff !== 0) return likeDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      mappedImages = mappedImages.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return NextResponse.json(
      {
        images: mappedImages,
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
