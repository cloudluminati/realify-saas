"use client";

import React, { useMemo, useState } from "react";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:5";
type OutputFormat = "png" | "jpg" | "webp";
type ModelChoice = "ideogram" | "openai_replicate";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text), raw: text };
  } catch {
    return { ok: res.ok, status: res.status, data: null as any, raw: text };
  }
}

export default function Home() {
  const [prompt, setPrompt] = useState<string>("");

  const [model, setModel] = useState<ModelChoice>("ideogram");

  // Common controls
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");

  // Ideogram-only
  const [seed, setSeed] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");

  // OpenAI-only: up to 3 images
  const [openAiImages, setOpenAiImages] = useState<File[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  const isIdeogram = model === "ideogram";
  const isOpenAI = model === "openai_replicate";

  const selectStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #333",
    background: "#fff",
    color: "#000",
  } as const;

  const inputStyle = selectStyle;

  // IMPORTANT:
  // - "multiple" allows selecting multiple at once
  // - we ALSO allow selecting more later without replacing by merging into state
  // - we clear input value so re-selecting the same file triggers onChange
  const onPickOpenAiImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;

    setOpenAiImages((prev) => {
      const merged = [...prev, ...list];

      // de-dupe
      const deduped: File[] = [];
      const seen = new Set<string>();
      for (const f of merged) {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(f);
        }
      }
      return deduped.slice(0, 3);
    });

    e.target.value = "";
  };

  const removeOpenAiImage = (index: number) => {
    setOpenAiImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canGenerate = useMemo(() => {
    if (loading) return false;
    if (!prompt.trim()) return false;
    if (isOpenAI && openAiImages.length === 0) return false;
    return true;
  }, [loading, prompt, isOpenAI, openAiImages.length]);

  const generate = async () => {
    setLoading(true);
    setError("");
    setUrl("");

    try {
      if (isIdeogram) {
        const trimmedSeed = (seed ?? "").trim();
        const seedNumber =
          trimmedSeed && !Number.isNaN(Number(trimmedSeed))
            ? Number(trimmedSeed)
            : undefined;

        const res = await fetch("/api/realify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            aspectRatio,
            outputFormat,
            seed: seedNumber,
            negativePrompt,
          }),
        });

        const parsed = await safeJson(res);
        if (!parsed.ok) {
          throw new Error(
            parsed.data?.error ||
              `Ideogram failed (${parsed.status}). ${parsed.raw?.slice(0, 200)}`
          );
        }

        const imageUrl = parsed.data?.url;
        if (!imageUrl || typeof imageUrl !== "string") {
          throw new Error("Ideogram API did not return a valid image URL");
        }

        setUrl(imageUrl);
      } else {
        // OPENAI via REPLICATE (FormData)
        const fd = new FormData();
        fd.append("prompt", prompt);
        fd.append("aspectRatio", aspectRatio);
        fd.append("outputFormat", outputFormat);

        openAiImages.slice(0, 3).forEach((file) => fd.append("images", file));

        // MUST match the folder: app/api/realify-openai/route.ts
        const res = await fetch("/api/realify-openai", {
          method: "POST",
          body: fd,
        });

        const parsed = await safeJson(res);
        if (!parsed.ok) {
          throw new Error(
            parsed.data?.error ||
              `OpenAI route failed (${parsed.status}). ${parsed.raw?.slice(0, 300)}`
          );
        }

        const imageUrl = parsed.data?.url;
        if (!imageUrl || typeof imageUrl !== "string") {
          throw new Error("OpenAI API did not return a valid image URL");
        }

        setUrl(imageUrl);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ width: "min(900px, 92vw)", textAlign: "center" }}>
        <h1 style={{ fontSize: 56, margin: 0 }}>Realify</h1>
        <p style={{ opacity: 0.75 }}>Type a prompt and generate an image</p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            isOpenAI
              ? "Example: put these friends together, keep faces/outfits, change background to an old Mexican ranch"
              : "Example: A realistic portrait photo of a ninja in a forest, cinematic lighting, 85mm lens"
          }
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

        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
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
              <option value="ideogram">Ideogram (Fast & Cheap)</option>
              <option value="openai_replicate">OpenAI (Low — Cheapest)</option>
            </select>
          </div>

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
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                disabled={loading}
                style={selectStyle}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>

            {isIdeogram ? (
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                  Seed (optional)
                </div>
                <input
                  value={seed ?? ""}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="12345"
                  disabled={loading}
                  inputMode="numeric"
                  style={inputStyle}
                />
              </div>
            ) : (
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                  Upload images (OpenAI) — up to 3
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickOpenAiImages}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>
            )}
          </div>

          {isIdeogram && (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
                Negative Prompt (optional)
              </div>
              <input
                value={negativePrompt ?? ""}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="blurry, low quality, deformed, extra fingers"
                disabled={loading}
                style={inputStyle}
              />
            </div>
          )}

          {isOpenAI && (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                Selected images
              </div>

              {openAiImages.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No images selected yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {openAiImages.map((f, idx) => (
                    <div
                      key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 14px",
                        borderRadius: 14,
                        background: "#111",
                        color: "#fff",
                        border: "1px solid #222",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "70%",
                        }}
                        title={f.name}
                      >
                        {idx + 1}. {f.name}
                      </div>
                      <button
                        onClick={() => removeOpenAiImage(idx)}
                        disabled={loading}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "1px solid #333",
                          background: "#1f1f1f",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Tip: upload 2–3 images + prompt like “put them together in one realistic photo”.
              </div>
            </div>
          )}
        </div>

        <button
          onClick={generate}
          disabled={!canGenerate}
          style={{
            marginTop: 16,
            padding: "12px 22px",
            borderRadius: 14,
            border: "1px solid #333",
            background: loading ? "#222" : "#111",
            color: "#fff",
            cursor: !canGenerate ? "not-allowed" : "pointer",
            minWidth: 160,
          }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {error && <p style={{ color: "#ff6b6b", marginTop: 14 }}>{error}</p>}

        {url && (
          <div style={{ marginTop: 18 }}>
            <img src={url} alt="generated" style={{ width: "100%", borderRadius: 18 }} />
          </div>
        )}
      </div>
    </main>
  );
}
