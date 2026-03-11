import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {

  try {

    const supabase = await getSupabaseServer();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ images: [] });
    }

    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const ids = follows?.map((f: any) => f.following_id) || [];

    if (ids.length === 0) {
      return NextResponse.json({ images: [] });
    }

    const { data: images } = await supabase
      .from("image_generation_history")
      .select("id,image_url,prompt,created_at,user_id")
      .in("user_id", ids)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      images: images || []
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json({
      images: []
    });

  }
}
