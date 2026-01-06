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

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const output = await replicate.run("ideogram-ai/ideogram-v2-turbo", {
      input: {
        prompt,
        aspect_ratio: "1:1",
        output_format: "png",
      },
    });

    const url = extractImageUrl(output);

    if (!url) {
      // Helpful debug info (keep this while testing)
      console.log("RAW OUTPUT TYPE:", Object.prototype.toString.call(output));
      console.log("RAW OUTPUT:", output);

      return NextResponse.json(
        { error: "No image URL returned from model output.", raw: output },
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
