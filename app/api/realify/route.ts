import { NextResponse } from "next/server";
import Replicate from "replicate";
import { getSupabaseServer } from "@/app/lib/supabase-server";

import {
  canConsume,
  consume,
  UNIT_COSTS,
} from "@/app/lib/units";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

/* -------------------------------------------------------------------------- */
/* RATE LIMITING SYSTEM                                                       */
/* -------------------------------------------------------------------------- */

const lastRequestMap = new Map<string, number>();
const REQUEST_COOLDOWN = 2000; // 2 seconds

const generationWindow = new Map<string, number[]>();
const MAX_GENERATIONS = 15;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Prevent parallel generations from multiple tabs
const activeGenerations = new Set<string>();

/* -------------------------------------------------------------------------- */

const ALLOWED_RATIOS = new Set([
  "match_input_image",
  "1:1",
  "16:9",
  "9:16",
  "4:5",
  "4:3",
  "3:2",
  "2:3",
  "21:9",
  "9:21",
]);

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  try {

    const supabaseServer = await getSupabaseServer();

    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "not_authenticated" },
        { status: 401 }
      );
    }

    const user_id = user.id;

    /* -------------------------------------------------------------------------- */
    /* PREVENT MULTIPLE TABS / PARALLEL GENERATIONS                               */
    /* -------------------------------------------------------------------------- */

    if (activeGenerations.has(user_id)) {
      return NextResponse.json(
        { error: "Generation already in progress" },
        { status: 429 }
      );
    }

    activeGenerations.add(user_id);

    try {

      /* -------------------------------------------------------------------------- */
      /* 2 SECOND COOLDOWN                                                          */
      /* -------------------------------------------------------------------------- */

      const now = Date.now();
      const lastRequest = lastRequestMap.get(user_id);

      if (lastRequest && now - lastRequest < REQUEST_COOLDOWN) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        );
      }

      lastRequestMap.set(user_id, now);

      /* -------------------------------------------------------------------------- */
      /* 15 GENERATIONS PER 5 MINUTES LIMIT                                         */
      /* -------------------------------------------------------------------------- */

      const userHistory = generationWindow.get(user_id) || [];

      const recent = userHistory.filter(
        (timestamp) => now - timestamp < WINDOW_MS
      );

      if (recent.length >= MAX_GENERATIONS) {
        return NextResponse.json(
          { error: "Generation limit reached. Please wait a few minutes." },
          { status: 429 }
        );
      }

      recent.push(now);
      generationWindow.set(user_id, recent);

      /* -------------------------------------------------------------------------- */

      const { data: sub } = await supabaseServer
        .from("subscriptions")
        .select("status")
        .eq("user_id", user_id)
        .in("status", ["active", "canceling"])
        .limit(1)
        .maybeSingle();

      if (!sub) {
        return NextResponse.json(
          { error: "no_subscription" },
          { status: 403 }
        );
      }

      if (!(await canConsume(UNIT_COSTS.nano))) {
        return NextResponse.json(
          { error: "limit_reached" },
          { status: 403 }
        );
      }

      const formData = await req.formData();
      const prompt = formData.get("prompt");
      const aspectRatioRaw = formData.get("aspectRatio");

      if (!prompt || typeof prompt !== "string") {
        return NextResponse.json(
          { error: "Missing prompt" },
          { status: 400 }
        );
      }

      const aspect_ratio =
        typeof aspectRatioRaw === "string" &&
        ALLOWED_RATIOS.has(aspectRatioRaw.trim())
          ? aspectRatioRaw.trim()
          : "match_input_image";

      const input: Record<string, any> = {
        prompt,
        output_format: "png",
        aspect_ratio,
      };

      const imageFiles = formData
        .getAll("images")
        .filter((f): f is File => f instanceof File)
        .slice(0, 14);

      if (imageFiles.length > 0) {
        input.image_input = imageFiles;
      }

      const output = await replicate.run(
        "google/nano-banana-pro",
        { input }
      );

      let buffer: Buffer | null = null;

      if (output instanceof ReadableStream) {
        buffer = await streamToBuffer(output);
      }

      const extract = (v: any): Buffer | null => {
        if (!v) return null;

        if (typeof v === "string" && v.length > 100) {
          return Buffer.from(v, "base64");
        }

        if (Array.isArray(v)) {
          for (const i of v) {
            const found = extract(i);
            if (found) return found;
          }
        }

        if (typeof v === "object") {
          for (const k of Object.keys(v)) {
            const found = extract(v[k]);
            if (found) return found;
          }
        }

        return null;
      };

      if (!buffer) buffer = extract(output);

      if (!buffer) {
        return NextResponse.json(
          { error: "generation_failed" },
          { status: 500 }
        );
      }

      const fileName = `nano-${Date.now()}.png`;

      const { error: uploadError } =
        await supabaseServer.storage
          .from("generations")
          .upload(fileName, buffer, {
            contentType: "image/png",
          });

      if (uploadError) {
        return NextResponse.json(
          { error: "storage_upload_failed" },
          { status: 500 }
        );
      }

      const { data } = supabaseServer.storage
        .from("generations")
        .getPublicUrl(fileName);

      await supabaseServer.from("image_generation_history").insert({
        user_id,
        prompt,
        model: "nano",
        aspect_ratio,
        image_url: data.publicUrl,
      });

      await consume(UNIT_COSTS.nano);

      return NextResponse.json({
        image: data.publicUrl,
      });

    } finally {

      // Always release the generation lock
      activeGenerations.delete(user_id);

    }

  } catch (err: any) {

    console.error("Nano generation error:", err);

    return NextResponse.json(
      { error: "generation_failed" },
      { status: 500 }
    );

  }
}
