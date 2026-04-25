import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { image_id } = await req.json();

    if (!image_id) {
      return NextResponse.json({ error: "missing_image_id" }, { status: 400 });
    }

    const { data: existingLike, error: existingError } = await supabase
      .from("image_likes")
      .select("user_id,image_id")
      .eq("user_id", user.id)
      .eq("image_id", image_id)
      .maybeSingle();

    if (existingError) {
      console.error("Like lookup error:", existingError);
      return NextResponse.json({ error: "like_lookup_failed" }, { status: 500 });
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from("image_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("image_id", image_id);

      if (deleteError) {
        console.error("Unlike error:", deleteError);
        return NextResponse.json({ error: "unlike_failed" }, { status: 500 });
      }

      return NextResponse.json({ liked: false });
    }

    const { error: insertError } = await supabase
      .from("image_likes")
      .insert({
        user_id: user.id,
        image_id,
      });

    if (insertError) {
      console.error("Like insert error:", insertError);
      return NextResponse.json({ error: "like_failed" }, { status: 500 });
    }

    return NextResponse.json({ liked: true });
  } catch (err) {
    console.error("Like error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
