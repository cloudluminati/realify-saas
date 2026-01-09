import { NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

function extractImageUrl(output: any): string | null {
  if (!output) return null;

  if (typeof output?.url === "function") return output.url();

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (typeof first?.url === "function") return first.url();
    if (first && typeof first === "object") {
      return first.url || first.image || first.output || first?.images?.[0]?.url || null;
    }
  }

  if (typeof output === "string") return output;

  if (output && typeof output === "object") {
    return output.url || output.image || output.output || output?.images?.[0]?.url || null;
  }

  return null;
}

const ALLOWED_RATIOS = new Set(["1:1", "16:9", "9:16", "4:5"]);
const ALLOWED_FORMATS = new Set(["png", "jpg", "webp"]);

export async function GET() {
  return NextResponse.json({ ok: true, route: "realify-openai" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const prompt = String(form.get("prompt") || "");
    if (!prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const aspectRatioRaw = String(form.get("aspectRatio") || "1:1");
    const outputFormatRaw = String(form.get("outputFormat") || "png");

    const aspect_ratio = ALLOWED_RATIOS.has(aspectRatioRaw) ? aspectRatioRaw : "1:1";
    const output_format = ALLOWED_FORMATS.has(outputFormatRaw) ? outputFormatRaw : "png";

    const files = form.getAll("images").filter(Boolean);

    if (files.length < 1) {
      return NextResponse.json({ error: "Please upload at least 1 image." }, { status: 400 });
    }
    if (files.length > 3) {
      return NextResponse.json({ error: "Max 3 images." }, { status: 400 });
    }

    const input: Record<string, any> = {
      prompt,
      aspect_ratio,
      output_format,
      input_images: files,
    };

    const output = await replicate.run("openai/gpt-image-1.5", { input });

    const url = extractImageUrl(output);
    if (!url) {
      return NextResponse.json(
        { error: "No image URL returned (unexpected output format).", raw: output },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("OPENAI ROUTE ERROR:", err);
    return NextResponse.json({ error: err?.message ?? "Generation failed" }, { status: 500 });
  }
}
