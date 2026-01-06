"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setUrl(null);

    try {
      const res = await fetch("/api/realify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");

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
