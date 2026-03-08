'use client';

import { useEffect, useState } from "react";

export default function ExplorePage() {

  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadImages() {

    try {

      const res = await fetch("/api/gallery", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data?.images) {

        setImages(data.images);
      }

    } catch {}

    setLoading(false);
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

    <main style={{ maxWidth: 1000, margin: "auto", padding: 40 }}>

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

          <div key={i}>

            <img
              src={img.image_url}
              style={{
                width: "100%",
                borderRadius: 8,
                objectFit: "cover",
              }}
            />

            {img.prompt && (

              <p
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  opacity: 0.7,
                }}
              >
                {img.prompt}
              </p>

            )}

          </div>

        ))}

      </div>

    </main>

  );
}
