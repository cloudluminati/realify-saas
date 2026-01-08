import { NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Handles Replicate outputs that are:
// - string URL
// - array of strings
// - FileOutput objects (need .url())
// - arrays of FileOutput
function extractImageUrl(output: any): string | null {
  if (!output) return null;

  // If the whole output is a FileOutput (ReadableStream) with a url() method
  if (typeof output?.url === "function") {
    return output.url();
  }

  // If it's an array (common case)
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];

    // array of string URLs
    if (typeof first === "string") return first;

    // array of FileOutput objects
    if (typeof first?.url === "function") return first.url();

    // array of objects with url fields
    if (first && typeof first === "object") {
      return (
        first.url ||
        first.image ||
        first.output ||
        first?.images?.[0]?.url ||
        null
      );
    }
  }

  // single string
  if (typeof output === "string") return output;

  // object with a url field
  if (output && typeof output === "object") {
    return (
      output.url ||
      output.image ||
      output.output ||
      output?.images?.[0]?.url ||
      null
    );
  }

  return null;
}

const ALLOWED_RATIOS = new Set(["1:1", "16:9", "9:16", "4:5"]);
const ALLOWED_FORMATS = new Set(["png", "jpg", "webp"]);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = body?.prompt;

    // ✅ Accept BOTH naming styles:
    // New UI (camelCase): aspectRatio/outputFormat/negativePrompt
    // Old style (snake_case): aspect_ratio/output_format/negative_prompt
    const aspectRatioRaw = body?.aspectRatio ?? body?.aspect_ratio ?? "1:1";
    const outputFormatRaw = body?.outputFormat ?? body?.output_format ?? "png";
    const negativePromptRaw =
      body?.negativePrompt ?? body?.negative_prompt ?? "";
    const seedRaw = body?.seed;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // ✅ Validate / normalize
    const aspect_ratio =
      typeof aspectRatioRaw === "string" && ALLOWED_RATIOS.has(aspectRatioRaw)
        ? aspectRatioRaw
        : "1:1";

    const output_format =
      typeof outputFormatRaw === "string" &&
      ALLOWED_FORMATS.has(outputFormatRaw)
        ? outputFormatRaw
        : "png";

    const input: Record<string, any> = {
      prompt,
      aspect_ratio,
      output_format,
    };

    // ✅ Seed: allow number OR numeric string
    if (typeof seedRaw === "number" && Number.isFinite(seedRaw)) {
      input.seed = seedRaw;
    } else if (typeof seedRaw === "string" && seedRaw.trim()) {
      const n = Number(seedRaw);
      if (Number.isFinite(n)) input.seed = n;
    }

    // ✅ Negative prompt
    if (typeof negativePromptRaw === "string" && negativePromptRaw.trim()) {
      input.negative_prompt = negativePromptRaw.trim();
    }

    const output = await replicate.run("ideogram-ai/ideogram-v2-turbo", {
      input,
    });

    console.log("IDEOGRAM INPUT:", input);

    const url = extractImageUrl(output);

    if (!url) {
      return NextResponse.json(
        {
          error:
            "No image URL returned from Ideogram output (unexpected format).",
          raw: output,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Generation failed" },
      { status: 500 }
    );
  }
}
