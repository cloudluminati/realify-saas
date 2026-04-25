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

    const userIds = Array.from(new Set((images || []).map((img) => img.user_id).filter(Boolean)));

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

    const mappedImages = (images || []).map((img) => ({
      ...img,
      creator_name: profileMap[img.user_id]?.display_name || "Realify User",
      creator_avatar_url: profileMap[img.user_id]?.avatar_url || null,
    }));

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
