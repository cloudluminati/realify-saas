import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// We upload to Supabase Storage using the SERVICE ROLE key on the server.
// This keeps the client from needing any write permissions.
const BUCKET = "realify-media";

// Keep it simple + safe
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (then restart dev server).",
        },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing "file" in form-data' }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: png, jpg, webp` },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max is ${MAX_BYTES / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const extFromName = (() => {
      const n = file.name || "";
      const parts = n.split(".");
      const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
      if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") return ext;
      return "";
    })();

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const finalExt = extFromName === "jpeg" ? "jpg" : extFromName || ext;

    const id = crypto.randomUUID();
    const path = `uploads/image/${id}.${finalExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = data?.publicUrl;

    if (!url) {
      return NextResponse.json(
        { error: "Upload succeeded but could not get public URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url, bucket: BUCKET, path });
  } catch (err: any) {
    console.error("UPLOAD ROUTE ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

