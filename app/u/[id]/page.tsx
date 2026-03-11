'use client';

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

export default function UserPage({ params }: any) {

  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadImages() {

    try {

      const res = await fetch(`/api/user-images?id=${params.id}`, {
        cache: "no-store"
      });

      const data = await res.json();

      if (data?.images) {
        setImages(data.images);
      }

    } catch {}

    setLoading(false);

  }

  async function followCreator() {

    try {

      await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: params.id
        })
      });

      alert("Now following this creator!");

    } catch {}

  }

  useEffect(() => {

    loadImages();

  }, []);

  if (loading) {

    return (
      <main style={{ maxWidth: 1100, margin: "auto", padding: 40 }}>
        <h1>Loading creator...</h1>
      </main>
    );

  }

  return (

    <main style={{ maxWidth: 1100, margin: "auto", padding: 40 }}>

      <div style={{ marginBottom: 30 }}>

        <h1>Creator Profile</h1>

        <button
          onClick={followCreator}
          style={{
            padding: "10px 18px",
            background: "#111",
            color: "#fff",
            borderRadius: 6,
            marginTop: 10
          }}
        >
          Follow Creator
        </button>

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 16
        }}
      >

        {images.map((img: any) => (

          <a
            key={img.id}
            href={`/image/${img.id}`}
            style={{ display: "block" }}
          >

            <img
              src={img.image_url}
              style={{
                width: "100%",
                borderRadius: 10
              }}
            />

          </a>

        ))}

      </div>

    </main>
  );
}
