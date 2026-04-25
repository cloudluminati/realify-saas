import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { searchParams } = new URL(req.url);
    const image_id = searchParams.get("image_id");

    if (!image_id) {
      return NextResponse.json({ comments: [] }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from("image_comments")
      .select("id,image_id,user_id,body,media_url,media_type,created_at")
      .eq("image_id", image_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json({ comments: [] }, { status: 500 });
    }

    const userIds = Array.from(new Set((comments || []).map((comment) => comment.user_id).filter(Boolean)));

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

    const mappedComments = (comments || []).map((comment) => ({
      ...comment,
      creator_name: profileMap[comment.user_id]?.display_name || "Realify User",
      creator_avatar_url: profileMap[comment.user_id]?.avatar_url || null,
    }));

    return NextResponse.json({ comments: mappedComments });
  } catch (err) {
    console.error("Comments GET error:", err);
    return NextResponse.json({ comments: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { image_id, body, media_url, media_type } = await req.json();

    const trimmedBody = typeof body === "string" ? body.trim() : "";

    if (!image_id) {
      return NextResponse.json({ error: "missing_image_id" }, { status: 400 });
    }

    if (!trimmedBody && !media_url) {
      return NextResponse.json({ error: "missing_comment_content" }, { status: 400 });
    }

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.identities?.[0]?.identity_data?.full_name ||
      user.identities?.[0]?.identity_data?.name ||
      null;

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    const { data: inserted, error } = await supabase
      .from("image_comments")
      .insert({
        image_id,
        user_id: user.id,
        body: trimmedBody || null,
        media_url: media_url || null,
        media_type: media_type || null,
      })
      .select("id,image_id,user_id,body,media_url,media_type,created_at")
      .single();

    if (error) {
      console.error("Comments insert error:", error);
      return NextResponse.json({ error: "comment_failed" }, { status: 500 });
    }

    return NextResponse.json({
      comment: {
        ...inserted,
        creator_name: fullName || (user.email ? String(user.email).split("@")[0] : "Realify User"),
        creator_avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      },
    });
  } catch (err) {
    console.error("Comments POST error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
