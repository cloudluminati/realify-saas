'use client';

import { useEffect, useState } from "react";

export default function ExplorePage() {

  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  async function loadImages() {

    try {

      const res = await fetch("/api/explore", {
        cache: "no-store",
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

  useEffect(() => {

    loadImages();

  }, []);

  if (loading) {

    return (
      <main style={{ maxWidth: 1000, margin: "auto", padding: 40 }}>
        <h1>Explore</h1>
        <p>Loading creations...</p>
      </main>
    );
  }

  return (

    <main style={{ maxWidth: 1100, margin: "auto", padding: 40 }}>

      <h1>Explore Creations</h1>

      <p style={{ opacity: 0.7 }}>
        See what others are creating with Realify.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 14,
          marginTop: 30,
        }}
      >

        {images.map((img, i) => (

          <img
            key={i}
            src={img.image_url}
            onClick={() => setSelectedImage(img)}
            style={{
              width: "100%",
              borderRadius: 8,
              objectFit: "cover",
              cursor: "pointer",
            }}
          />

        ))}

      </div>

      {selectedImage && (

        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20
          }}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 900,
              width: "100%",
              background: "#111",
              padding: 20,
              borderRadius: 10
            }}
          >

            <img
              src={selectedImage.image_url}
              style={{
                width: "100%",
                borderRadius: 8
              }}
            />

            {selectedImage.prompt && (

              <p
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  color: "#ccc"
                }}
              >
                {selectedImage.prompt}
              </p>

            )}

            <div style={{ marginTop: 12 }}>

              <button
                onClick={() => remixPrompt(selectedImage.prompt)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff",
                  marginRight: 10
                }}
              >
                Remix Prompt
              </button>

              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff"
                }}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  );
}
