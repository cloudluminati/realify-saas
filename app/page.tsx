"use client";

import { useState } from "react";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:5";
type OutputFormat = "png" | "jpg" | "webp";

export default function Home() {
  const [prompt, setPrompt] = useState("");

  // Controls
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [seed, setSeed] = useState(""); // keep as text input
  const [negativePrompt, setNegativePrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setUrl(null);

    // seed handling (avoid NaN)
    const trimmedSeed = seed.trim();
    const seedNumber =
      trimmedSeed && !Number.isNaN(Number(trimmedSeed))
        ? Number(trimmedSeed)
        : undefined;

    try {
      const res = await fetch("/api/realify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio, // ✅ camelCase (server will map to Ideogram input)
          outputFormat,
          seed: seedNumber,
          negativePrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");

      if (!data.url || typeof data.url !== "string") {
        throw new Error("API did not return a valid image URL");
      }

      setUrl(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ width: "min(700px, 92vw)", textAlign: "center" }}>
        <h1 style={{ fontSize: 56, margin: 0 }}>Realify</h1>
        <p style={{ opacity: 0.75 }}>Type a prompt and generate an image</p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: A realistic portrait photo of a ninja in a forest, cinematic lighting, 85mm lens"
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

        {/* Controls */}
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
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
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#fff",
                }}
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
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#fff",
                }}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>

            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                Seed (optional)
              </div>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="12345"
                disabled={loading}
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#fff",
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
              Negative Prompt (optional)
            </div>
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality, deformed, extra fingers"
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #333",
                background: "#fff",
              }}
            />
          </div>
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
