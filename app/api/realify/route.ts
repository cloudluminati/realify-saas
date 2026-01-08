import { NextResponse } from "next/server";
import Replicate from "replicate";
import OpenAI from "openai";

export const runtime = "nodejs";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

const ALLOWED_MODELS = new Set(["ideogram", "openai"]);
const ALLOWED_RATIOS = new Set(["1:1", "16:9", "9:16", "4:5"]);
const ALLOWED_FORMATS = new Set(["png", "jpg", "webp"]);

function mapAspectRatioToOpenAISize(aspect_ratio: string) {
  // OpenAI image sizes:
  // - 1024x1024 (square)
  // - 1536x1024 (landscape)
  // - 1024x1536 (portrait)
  if (aspect_ratio === "16:9") return "1536x1024";
  if (aspect_ratio === "9:16") return "1024x1536";
  if (aspect_ratio === "4:5") return "1024x1536"; // closest portrait
  return "1024x1024";
}

export async function POST(req: Request) {
  try {
    // ✅ FormData (supports file uploads)
    const form = await req.formData();

    const prompt = form.get("prompt");
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const modelRaw = (form.get("model") as string) ?? "ideogram";
    const model =
      typeof modelRaw === "string" && ALLOWED_MODELS.has(modelRaw)
        ? modelRaw
        : "ideogram";

    const aspectRatioRaw = (form.get("aspectRatio") as string) ?? "1:1";
    const aspect_ratio =
      typeof aspectRatioRaw === "string" && ALLOWED_RATIOS.has(aspectRatioRaw)
        ? aspectRatioRaw
        : "1:1";

    const outputFormatRaw = (form.get("outputFormat") as string) ?? "png";
    const output_format =
      typeof outputFormatRaw === "string" && ALLOWED_FORMATS.has(outputFormatRaw)
        ? outputFormatRaw
        : "png";

    const seedRaw = form.get("seed") as string | null;
    const seed =
      seedRaw && seedRaw.trim() && Number.isFinite(Number(seedRaw))
        ? Number(seedRaw)
        : undefined;

    const negative_prompt = ((form.get("negativePrompt") as string) ?? "").trim();

    // Uploaded files come in under "images" from the frontend
    const images = form.getAll("images") as File[];

    // -----------------------------
    // ✅ IDEOGRAM (supports input_images)
    // -----------------------------
    if (model === "ideogram") {
      const input: Record<string, any> = {
        prompt,
        aspect_ratio,
        output_format,
      };

      if (typeof seed === "number") input.seed = seed;
      if (negative_prompt) input.negative_prompt = negative_prompt;

      // ✅ Add uploaded images (if any)
      if (images && images.length > 0) {
        input.input_images = images; // IMPORTANT: matches Replicate field name
      }

      console.log("IDEOGRAM INPUT:", {
        ...input,
        input_images: images?.length ? `[${images.length} file(s)]` : undefined,
      });

      const output = await replicate.run("ideogram-ai/ideogram-v2-turbo", {
        input,
      });

      const url = extractImageUrl(output);

      if (!url) {
        return NextResponse.json(
          {
            error: "No image URL returned from Ideogram output (unexpected format).",
            raw: output,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ url, provider: "ideogram" });
    }

    // -----------------------------
    // ✅ OPENAI (LOW ONLY - cheapest)
    // -----------------------------
    const openaiOutputFormat = output_format === "jpg" ? "jpeg" : output_format;
    const size = mapAspectRatioToOpenAISize(aspect_ratio);

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      quality: "low", // 🔒 LOCKED CHEAPEST
      size,
      output_format: openaiOutputFormat as any,
    });

    const b64 = (result as any)?.data?.[0]?.b64_json;
    if (!b64 || typeof b64 !== "string") {
      return NextResponse.json(
        { error: "OpenAI did not return base64 image data.", raw: result },
        { status: 500 }
      );
    }

    const mime =
      openaiOutputFormat === "jpeg"
        ? "image/jpeg"
        : `image/${openaiOutputFormat}`;

    const dataUrl = `data:${mime};base64,${b64}`;

    return NextResponse.json({ url: dataUrl, provider: "openai" });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Generation failed" },
      { status: 500 }
    );
  }
}
