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

    const encoded = encodeURIComponent(prompt);

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

  if (loading) {

    return (
      <main style={{ maxWidth: 1000, margin: "auto", padding: 40 }}>
        <h1>History</h1>
        <p>Loading your images...</p>
      </main>
    );

  }

  return (

    <main style={{ maxWidth: 1100, margin: "auto", padding: 40 }}>

      <h1>My Generations</h1>

      <p style={{ opacity: 0.7 }}>
        Images you've created with Realify
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 16,
          marginTop: 30
        }}
      >

        {images.map((img) => (

          <div
            key={img.id}
            style={{
              borderRadius: 10,
              overflow: "hidden",
              background: "#111"
            }}
          >

            <img
              src={img.image_url}
              style={{
                width: "100%",
                display: "block"
              }}
            />

            <div style={{ padding: 10 }}>

              <button
                onClick={() => remixPrompt(img.prompt)}
                style={{ marginRight: 8 }}
              >
                Remix
              </button>

              <button
                onClick={() => shareImage(img.id)}
                style={{ marginRight: 8 }}
              >
                Share
              </button>

              <a
                href={img.image_url}
                download="realify-image.png"
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
