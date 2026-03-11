import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {

  try {

    const { user_id } = await req.json();

    const supabase = await getSupabaseServer();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: user_id
      });

    return NextResponse.json({ success: true });

  } catch (err) {

    console.error(err);

    return NextResponse.json({ error: "Follow failed" }, { status: 500 });

  }
}
