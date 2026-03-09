'use client';

import { useEffect, useState } from "react";

export default function ExplorePage() {

  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});

  async function loadImages() {

    try {

      const res = await fetch("/api/explore", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data?.images) {

        setImages(data.images);

        const ids = data.images.map((i: any) => i.id);

        const likeRes = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_ids: ids }),
        });

        const likeData = await likeRes.json();

        if (likeData?.counts) {
          setLikes(likeData.counts);
        }

      }

    } catch {}

    setLoading(false);
  }

  async function likeImage(image_id: string) {

    try {

      await fetch("/api/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image_id })
      });

      setLikes((prev) => ({
        ...prev,
        [image_id]: (prev[image_id] || 0) + 1
      }));

    } catch {}

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

          <div
            key={i}
            className="image-card"
            style={{
              position: "relative",
              borderRadius: 8,
              overflow: "hidden"
            }}
          >

            <img
              src={img.image_url}
              onClick={() => setSelectedImage(img)}
              style={{
                width: "100%",
                objectFit: "cover",
                cursor: "pointer",
                display: "block"
              }}
            />

            <div className="hover-actions">

              <button
                onClick={() => likeImage(img.id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#e63946",
                  color: "#fff",
                  fontSize: 12
                }}
              >
                ❤️ {likes[img.id] || 0}
              </button>

              <button
                onClick={() => remixPrompt(img.prompt)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#111",
                  color: "#fff",
                  fontSize: 12
                }}
              >
                Remix
              </button>

              <a
                href={img.image_url}
                download="realify-image.png"
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#111",
                  color: "#fff",
                  fontSize: 12,
                  textDecoration: "none"
                }}
              >
                Download
              </a>

            </div>

          </div>

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

      <style jsx>{`

        .image-card {
          position: relative;
        }

        .hover-actions {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .image-card:hover .hover-actions {
          opacity: 1;
        }

      `}</style>

    </main>

  );
}
