"use client";

import { useState } from "react";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:5";
type OutputFormat = "png" | "jpg" | "webp";
type ModelChoice = "ideogram" | "openai";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ModelChoice>("openai");

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");

  // Ideogram-only controls (we will hide these when OpenAI is selected)
  const [seed, setSeed] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  // ✅ Uploads ONLY for OpenAI
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const selectStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #333",
    background: "#fff",
    color: "#000",
  } as const;

  const inputStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #333",
    background: "#fff",
    color: "#000",
  } as const;

  const generate = async () => {
    setLoading(true);
    setError(null);
    setUrl(null);

    try {
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("model", model);
      form.append("aspectRatio", aspectRatio);
      form.append("outputFormat", outputFormat);

      // ✅ Uploads ONLY when OpenAI is selected
      if (model === "openai") {
        for (const file of files) {
          form.append("images", file);
        }
      }

      // (kept for compatibility, but not used when model=openai)
      const trimmedSeed = seed.trim();
      if (model === "ideogram" && trimmedSeed) form.append("seed", trimmedSeed);
      if (model === "ideogram" && negativePrompt.trim())
        form.append("negativePrompt", negativePrompt.trim());

      const res = await fetch("/api/realify", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Generation failed");
      if (!data.url || typeof data.url !== "string")
        throw new Error("API did not return a valid image URL");

      setUrl(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ width: "min(760px, 92vw)", textAlign: "center" }}>
        <h1 style={{ fontSize: 56, margin: 0 }}>Realify</h1>
        <p style={{ opacity: 0.75 }}>Type a prompt and generate an image</p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Make this image realistic, cinematic lighting..."
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            marginTop: 12,
          }}
        />

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {/* Model */}
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
              Model
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelChoice)}
              disabled={loading}
              style={selectStyle}
            >
              <option value="openai">OpenAI (Low – Cheapest)</option>
              <option value="ideogram">Ideogram (Fast & Cheap)</option>
            </select>
          </div>

          {/* Aspect Ratio + Format */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                Aspect Ratio
              </div>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                disabled={loading}
                style={selectStyle}
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Instagram)</option>
                <option value="9:16">9:16 (Portrait / TikTok)</option>
                <option value="16:9">16:9 (Landscape)</option>
              </select>
            </div>

            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                Format
              </div>
              <select
                value={outputFormat}
                onChange={(e) =>
                  setOutputFormat(e.target.value as OutputFormat)
                }
                disabled={loading}
                style={selectStyle}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
          </div>

          {/* ✅ OpenAI upload section */}
          {model === "openai" ? (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                Upload image(s) (OpenAI)
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={loading}
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  setFiles(list);
                }}
                style={{ color: "#fff" }}
              />
              {files.length > 0 && (
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  Selected: {files.map((f) => f.name).join(", ")}
                </div>
              )}
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                Tip: Upload 2 images + prompt: “put both characters together in
                one realistic photo”.
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "left",
                fontSize: 12,
                opacity: 0.8,
                lineHeight: 1.5,
                border: "1px solid #333",
                borderRadius: 12,
                padding: 12,
              }}
            >
              Ideogram mode: uploads disabled (by design). Prompt-only.
            </div>
          )}
        </div>

        <button
          onClick={generate}
          disabled={!prompt.trim() || loading}
          style={{
            marginTop: 12,
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #333",
            background: loading ? "#222" : "#1f1f1f",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {error && (
          <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>
        )}

        {url && (
          <div style={{ marginTop: 18 }}>
            <img
              src={url}
              alt="generated"
              style={{ width: "100%", borderRadius: 18 }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
