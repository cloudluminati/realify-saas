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

    const { error } = await supabase
      .from("image_likes")
      .insert({
        user_id: user.id,
        image_id
      });

    if (error) {

      if (error.code === "23505") {
        return NextResponse.json({ liked: true });
      }

      return NextResponse.json({ error: "like_failed" }, { status: 500 });
    }

    return NextResponse.json({ liked: true });

  } catch (err) {

    console.error("Like error:", err);

    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
