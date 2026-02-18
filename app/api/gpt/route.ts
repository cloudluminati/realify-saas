import { NextResponse } from "next/server";
import Replicate from "replicate";
import { supabaseServer } from "@/app/lib/supabase-server";

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

const GPT_ALLOWED_RATIOS = new Set([
  "1:1",
  "3:2",
  "2:3",
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

const findStream = (v: any): ReadableStream | null => {
  if (!v) return null;
  if (v instanceof ReadableStream) return v;

  if (Array.isArray(v)) {
    for (const i of v) {
      const found = findStream(i);
      if (found) return found;
    }
  }

  if (typeof v === "object") {
    for (const k of Object.keys(v)) {
      const found = findStream(v[k]);
      if (found) return found;
    }
  }

  return null;
};

const extractBuffer = (v: any): Buffer | null => {
  if (!v) return null;

  if (typeof v === "string" && v.length > 100) {
    try {
      return Buffer.from(v, "base64");
    } catch {
      return null;
    }
  }

  if (Array.isArray(v)) {
    for (const i of v) {
      const found = extractBuffer(i);
      if (found) return found;
    }
  }

  if (typeof v === "object") {
    for (const k of Object.keys(v)) {
      const found = extractBuffer(v[k]);
      if (found) return found;
    }
  }

  return null;
};

export async function POST(req: Request) {
  try {
    // ⭐ AUTH USER
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

    // ⭐ CHECK ACTIVE SUBSCRIPTION
    const { data: sub } = await supabaseServer
      .from("subscriptions")
      .select("status")
      .eq("user_id", user_id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!sub) {
      return NextResponse.json(
        { error: "no_subscription" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const prompt = formData.get("prompt");
    const aspectRatioRaw = formData.get("aspectRatio");
    const qualityRaw = formData.get("quality");

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const quality =
      qualityRaw === "low" ||
      qualityRaw === "medium" ||
      qualityRaw === "high" ||
      qualityRaw === "auto"
        ? qualityRaw
        : "auto";

    const cost = UNIT_COSTS.gpt[quality];

    // ⭐ CREDIT CHECK
    if (!(await canConsume(cost))) {
      return NextResponse.json(
        { error: "limit_reached" },
        { status: 403 }
      );
    }

    const images = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File);

    const aspect_ratio =
      GPT_ALLOWED_RATIOS.has(String(aspectRatioRaw))
        ? String(aspectRatioRaw)
        : "1:1";

    const input: Record<string, any> = {
      prompt,
      aspect_ratio,
      output_format: "png",
      quality,
    };

    if (images.length > 0) {
      input.input_images = images;
    }

    const output = await replicate.run("openai/gpt-image-1.5", {
      input,
    });

    const stream = findStream(output);
    let buffer: Buffer | null = null;

    if (stream) buffer = await streamToBuffer(stream);
    if (!buffer) buffer = extractBuffer(output);

    if (!buffer) {
      console.error("GPT OUTPUT:", output);
      return NextResponse.json(
        { error: "generation_failed" },
        { status: 500 }
      );
    }

    const fileName = `gpt-${Date.now()}.png`;

    const { error: uploadError } =
      await supabaseServer.storage
        .from("generations")
        .upload(fileName, buffer, {
          contentType: "image/png",
        });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
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
      model: "gpt",
      aspect_ratio,
      image_url: data.publicUrl,
    });

    await consume(cost);

    return NextResponse.json({
      image: data.publicUrl,
    });

  } catch (err: any) {
    console.error("GPT ERROR:", err);

    if (
      err?.message?.includes("E003") ||
      err?.message?.includes("unavailable") ||
      err?.message?.includes("high demand")
    ) {
      return NextResponse.json(
        { error: "servers_busy" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "generation_failed" },
      { status: 500 }
    );
  }
}

