'use client';

import { useEffect, useState } from "react";

export default function ExplorePage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedByUser, setLikedByUser] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState("new");
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});

  async function loadImages(sortType: string) {
    setLoading(true);

    try {
      let endpoint = "/api/explore?sort=" + sortType;

      if (sortType === "following") {
        endpoint = "/api/following-feed";
      }

      const res = await fetch(endpoint, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data?.images) {
        setImages(data.images);

        const ids = data.images
          .map((i: any) => i.id)
          .filter(Boolean);

        if (ids.length > 0) {
          const likeRes = await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_ids: ids }),
          });

          const likeData = await likeRes.json();

          if (likeData?.counts) {
            setLikes(likeData.counts);
          } else {
            setLikes({});
          }

          const likedMap: Record<string, boolean> = {};
          if (Array.isArray(likeData?.liked_ids)) {
            likeData.liked_ids.forEach((id: string) => {
              likedMap[id] = true;
            });
          }
          setLikedByUser(likedMap);
        } else {
          setLikes({});
          setLikedByUser({});
        }
      }
    } catch {}

    setLoading(false);
  }

  async function likeImage(image_id: string) {
    if (!image_id || likeLoading[image_id]) return;

    setLikeLoading((prev) => ({
      ...prev,
      [image_id]: true,
    }));

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_id }),
      });

      const data = await res.json();

      if (!res.ok) return;

      const nowLiked = !!data.liked;

      setLikedByUser((prev) => ({
        ...prev,
        [image_id]: nowLiked,
      }));

      setLikes((prev) => {
        const currentCount = prev[image_id] || 0;

        return {
          ...prev,
          [image_id]: nowLiked
            ? currentCount + 1
            : Math.max(0, currentCount - 1),
        };
      });
    } catch {
    } finally {
      setLikeLoading((prev) => ({
        ...prev,
        [image_id]: false,
      }));
    }
  }

  function remixPrompt(prompt: string) {
    const encoded = encodeURIComponent(prompt || "");
    window.location.href = `/?prompt=${encoded}`;
  }

  function generateThis(prompt: string) {
    const encoded = encodeURIComponent(prompt || "");
    window.location.href = `/?prompt=${encoded}`;
  }

  async function copyPrompt(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt || "");
      alert("Prompt copied!");
    } catch {}
  }

  async function shareImage(image_id: string) {
    try {
      const url = `${window.location.origin}/image/${image_id}`;
      await navigator.clipboard.writeText(url);
      alert("Share link copied!");
    } catch {}
  }

  useEffect(() => {
    loadImages(sort);
  }, [sort]);

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

  const pillButton: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 14,
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
          <h1 style={{ marginTop: 0, color: "white" }}>Explore</h1>
          <p style={{ color: "rgba(255,255,255,0.72)" }}>Loading creations...</p>
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
          Explore Creations
        </h1>

        <p style={{ opacity: 0.72, color: "white", marginTop: 14 }}>
          See what others are creating with Realify.
        </p>

        <div style={{ marginTop: 20, marginBottom: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setSort("following")} style={pillButton}>
            Following
          </button>

          <button onClick={() => setSort("trending")} style={pillButton}>
            Trending
          </button>

          <button onClick={() => setSort("new")} style={pillButton}>
            Newest
          </button>

          <button onClick={() => setSort("liked")} style={pillButton}>
            Most Liked
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 14,
          marginTop: 20,
        }}
      >
        {images.map((img, i) => (
          <div
            key={img.id ?? `${img.image_url ?? "image"}-${i}`}
            className="image-card"
            style={{
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
            }}
          >
            <img
              src={img.image_url}
              onClick={() => setSelectedImage(img)}
              style={{
                width: "100%",
                objectFit: "cover",
                cursor: "pointer",
                display: "block",
              }}
            />

            <div className="hover-actions">
              <button
                onClick={() => likeImage(img.id)}
                disabled={!!likeLoading[img.id]}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: likedByUser[img.id] ? "#c1121f" : "#e63946",
                  color: "#fff",
                  fontSize: 12,
                  opacity: likeLoading[img.id] ? 0.7 : 1,
                  cursor: likeLoading[img.id] ? "not-allowed" : "pointer",
                }}
              >
                {likedByUser[img.id] ? "💔" : "❤️"} {likes[img.id] || 0}
              </button>

              <button
                onClick={() => remixPrompt(img.prompt)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#111",
                  color: "#fff",
                  fontSize: 12,
                }}
              >
                Remix
              </button>

              <button
                onClick={() => shareImage(img.id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#457b9d",
                  color: "#fff",
                  fontSize: 12,
                }}
              >
                Share
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
                  textDecoration: "none",
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
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 900,
              width: "100%",
              background: "#111",
              padding: 20,
              borderRadius: 10,
            }}
          >
            <img
              src={selectedImage.image_url}
              style={{
                width: "100%",
                borderRadius: 8,
              }}
            />

            {selectedImage.prompt && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  color: "#ccc",
                }}
              >
                {selectedImage.prompt}
              </p>
            )}

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => likeImage(selectedImage.id)}
                disabled={!!likeLoading[selectedImage.id]}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: likedByUser[selectedImage.id] ? "#c1121f" : "#222",
                  color: "#fff",
                  opacity: likeLoading[selectedImage.id] ? 0.7 : 1,
                }}
              >
                {likedByUser[selectedImage.id] ? "Unlike" : "Like"} ({likes[selectedImage.id] || 0})
              </button>

              <button
                onClick={() => remixPrompt(selectedImage.prompt)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff",
                }}
              >
                Remix Prompt
              </button>

              <button
                onClick={() => copyPrompt(selectedImage.prompt)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff",
                }}
              >
                Copy Prompt
              </button>

              <button
                onClick={() => generateThis(selectedImage.prompt)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#2a9d8f",
                  color: "#fff",
                }}
              >
                Generate This
              </button>

              <button
                onClick={() => shareImage(selectedImage.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#457b9d",
                  color: "#fff",
                }}
              >
                Share
              </button>

              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff",
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
          flex-wrap: wrap;
          padding: 12px;
        }

        .image-card:hover .hover-actions {
          opacity: 1;
        }
      `}</style>
    </main>
  );
}
