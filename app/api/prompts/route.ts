import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {

  try {

    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from("image_generation_history")
      .select("prompt")
      .not("prompt", "is", null)
      .limit(500);

    const counts: Record<string, number> = {};

    data?.forEach((row) => {

      const p = row.prompt?.trim();

      if (!p) return;

      counts[p] = (counts[p] || 0) + 1;

    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([prompt, count]) => ({
        prompt,
        count
      }));

    return NextResponse.json({
      prompts: sorted
    });

  } catch (err) {

    console.error("Prompt leaderboard error:", err);

    return NextResponse.json({
      prompts: []
    });

  }

}
