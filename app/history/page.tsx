'use client';

import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    try {
      const res = await fetch("/api/gallery", {
        cache: "no-store"
      });

      const data = await res.json();

      if (data?.images) {
        setImages(data.images);
      }
    } catch {}

    setLoading(false);
  }

  function remixPrompt(prompt: string) {
    const encoded = encodeURIComponent(prompt || "");
    window.location.href = `/?prompt=${encoded}`;
  }

  async function shareImage(id: string) {
    const url = `${window.location.origin}/image/${id}`;

    try {
      await navigator.clipboard.writeText(url);
      alert("Share link copied!");
    } catch {}
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const pageWrap: React.CSSProperties = {
    maxWidth: 1100,
    margin: "auto",
    padding: 40,
  };

  const navButton: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: 16,
    background: "#171717",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    fontWeight: 700,
    cursor: "pointer",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.92)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 20,
    boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
    padding: 24,
  };

  if (loading) {
    return (
      <main style={pageWrap}>
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => (window.location.href = "/")} style={navButton}>
            ⌂ Home
          </button>
        </div>

        <div style={cardStyle}>
          <h1 style={{ marginTop: 0, color: "white" }}>History</h1>
          <p style={{ color: "rgba(255,255,255,0.72)" }}>Loading your images...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageWrap}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => (window.location.href = "/")} style={navButton}>
          ⌂ Home
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            color: "white",
            fontSize: 42,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontWeight: 800,
          }}
        >
          My Generations
        </h1>

        <p style={{ opacity: 0.72, color: "white", marginTop: 14 }}>
          Images you've created with Realify
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 16,
          marginTop: 30
        }}
      >
        {images.map((img, index) => (
          <div
            key={img.id ?? `${img.image_url ?? "image"}-${index}`}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            }}
          >
            <img
              src={img.image_url}
              style={{
                width: "100%",
                display: "block"
              }}
            />

            <div style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => remixPrompt(img.prompt)}
                style={navButton}
              >
                Remix
              </button>

              <button
                onClick={() => shareImage(img.id)}
                style={navButton}
              >
                Share
              </button>

              <a
                href={img.image_url}
                download="realify-image.png"
                style={{
                  ...navButton,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
