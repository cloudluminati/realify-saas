'use client';

import { useEffect, useMemo, useRef, useState } from "react";

type ExploreImage = {
  id: string;
  image_url: string;
  prompt: string | null;
  created_at: string;
  user_id?: string | null;
  creator_name?: string | null;
  creator_avatar_url?: string | null;
};

type ImageComment = {
  id: string;
  image_id: string;
  user_id: string;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  creator_name?: string | null;
  creator_avatar_url?: string | null;
};

export default function ExplorePage() {
  const [images, setImages] = useState<ExploreImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ExploreImage | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedByUser, setLikedByUser] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState("new");
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});

  const [comments, setComments] = useState<Record<string, ImageComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [commentBody, setCommentBody] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentMediaUrl, setCommentMediaUrl] = useState<string | null>(null);
  const [commentMediaType, setCommentMediaType] = useState<string | null>(null);
  const [commentUploading, setCommentUploading] = useState(false);

  const commentFileRef = useRef<HTMLInputElement | null>(null);

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

        setSelectedImage((prev) => {
          if (prev) {
            const stillExists = data.images.find((img: ExploreImage) => img.id === prev.id);
            if (stillExists) return stillExists;
          }

          return data.images[0] || null;
        });

        const ids = data.images
          .map((i: ExploreImage) => i.id)
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

  async function loadComments(imageId: string) {
    if (!imageId) return;

    setCommentsLoading((prev) => ({
      ...prev,
      [imageId]: true,
    }));

    try {
      const res = await fetch(`/api/comments?image_id=${encodeURIComponent(imageId)}`, {
        cache: "no-store",
      });

      const data = await res.json();

      setComments((prev) => ({
        ...prev,
        [imageId]: Array.isArray(data?.comments) ? data.comments : [],
      }));
    } catch {
      setComments((prev) => ({
        ...prev,
        [imageId]: [],
      }));
    } finally {
      setCommentsLoading((prev) => ({
        ...prev,
        [imageId]: false,
      }));
    }
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

  function remixPrompt(prompt: string | null) {
    const encoded = encodeURIComponent(prompt || "");
    window.location.href = `/?prompt=${encoded}`;
  }

  function generateThis(prompt: string | null) {
    const encoded = encodeURIComponent(prompt || "");
    window.location.href = `/?prompt=${encoded}`;
  }

  async function copyPrompt(prompt: string | null) {
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

  async function uploadCommentMedia(file: File) {
    setCommentUploading(true);
    setCommentError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        setCommentError(data?.error || "Upload failed.");
        return;
      }

      setCommentMediaUrl(data.url);
      setCommentMediaType(file.type || null);
    } catch {
      setCommentError("Upload failed.");
    } finally {
      setCommentUploading(false);
    }
  }

  async function submitComment() {
    if (!selectedImage?.id || commentSending) return;

    const trimmed = commentBody.trim();

    if (!trimmed && !commentMediaUrl) {
      setCommentError("Add a comment or attach an image/GIF.");
      return;
    }

    setCommentSending(true);
    setCommentError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_id: selectedImage.id,
          body: trimmed,
          media_url: commentMediaUrl,
          media_type: commentMediaType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.comment) {
        setCommentError(data?.error || "Could not post comment.");
        return;
      }

      setComments((prev) => ({
        ...prev,
        [selectedImage.id]: [...(prev[selectedImage.id] || []), data.comment],
      }));

      setCommentBody("");
      setCommentMediaUrl(null);
      setCommentMediaType(null);

      if (commentFileRef.current) {
        commentFileRef.current.value = "";
      }
    } catch {
      setCommentError("Could not post comment.");
    } finally {
      setCommentSending(false);
    }
  }

  useEffect(() => {
    async function syncAndLoad() {
      try {
        await fetch("/api/profile-sync", {
          method: "POST",
          credentials: "include",
        });
      } catch {}

      loadImages(sort);
    }

    syncAndLoad();
  }, [sort]);

  useEffect(() => {
    if (selectedImage?.id) {
      loadComments(selectedImage.id);
    }
  }, [selectedImage?.id]);

  const activeComments = useMemo(() => {
    if (!selectedImage?.id) return [];
    return comments[selectedImage.id] || [];
  }, [comments, selectedImage?.id]);

  function timeAgo(dateString: string) {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diff = Math.max(0, now - then);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return "just now";
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    return `${Math.floor(diff / day)}d ago`;
  }

  const pageWrap: React.CSSProperties = {
    maxWidth: 1500,
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
    borderRadius: 22,
    boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
    padding: 24,
  };

  const actionButton: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#171717",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
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
          Discover what others are making with Realify.
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
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(420px, 560px)",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...cardStyle,
            position: "sticky",
            top: 24,
            alignSelf: "start",
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto",
            paddingRight: 18,
          }}
        >
          {selectedImage ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "white",
                    fontWeight: 800,
                  }}
                >
                  {selectedImage.creator_avatar_url ? (
                    <img
                      src={selectedImage.creator_avatar_url}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    (selectedImage.creator_name || "R").slice(0, 1).toUpperCase()
                  )}
                </div>

                <div>
                  <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>
                    {selectedImage.creator_name || "Realify User"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                    {timeAgo(selectedImage.created_at)}
                  </div>
                </div>
              </div>

              {selectedImage.prompt && (
                <div style={{ marginTop: 4, marginBottom: 16 }}>
                  <div
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: 800,
                      marginBottom: 10,
                    }}
                  >
                    Prompt
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.82)",
                      fontSize: 14,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedImage.prompt}
                  </div>
                </div>
              )}

              <img
                src={selectedImage.image_url}
                style={{
                  width: "100%",
                  borderRadius: 18,
                  display: "block",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                }}
              />

              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => likeImage(selectedImage.id)}
                  disabled={!!likeLoading[selectedImage.id]}
                  style={{
                    ...actionButton,
                    background: likedByUser[selectedImage.id] ? "#c1121f" : "#171717",
                    opacity: likeLoading[selectedImage.id] ? 0.7 : 1,
                  }}
                >
                  {likedByUser[selectedImage.id] ? "💔 Unlike" : "❤️ Like"} ({likes[selectedImage.id] || 0})
                </button>

                <button onClick={() => remixPrompt(selectedImage.prompt)} style={actionButton}>
                  Remix
                </button>

                <button onClick={() => generateThis(selectedImage.prompt)} style={actionButton}>
                  Generate This
                </button>

                <button onClick={() => copyPrompt(selectedImage.prompt)} style={actionButton}>
                  Copy Prompt
                </button>

                <button onClick={() => shareImage(selectedImage.id)} style={actionButton}>
                  Share
                </button>

                <a
                  href={selectedImage.image_url}
                  download="realify-image.png"
                  style={{
                    ...actionButton,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Download
                </a>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ color: "white", fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                  Comments
                </div>

                <div
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Write a comment..."
                    style={{
                      width: "100%",
                      minHeight: 92,
                      padding: 14,
                      borderRadius: 14,
                      background: "#0f0f0f",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.10)",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      ref={commentFileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void uploadCommentMedia(file);
                        }
                      }}
                      style={{ color: "white" }}
                    />

                    {commentUploading && (
                      <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>Uploading media...</div>
                    )}

                    {commentMediaUrl && (
                      <button
                        onClick={() => {
                          setCommentMediaUrl(null);
                          setCommentMediaType(null);
                          if (commentFileRef.current) commentFileRef.current.value = "";
                        }}
                        style={actionButton}
                      >
                        Remove attachment
                      </button>
                    )}

                    <button
                      onClick={() => void submitComment()}
                      disabled={commentSending || commentUploading}
                      style={{
                        ...actionButton,
                        background: "white",
                        color: "black",
                        border: "none",
                      }}
                    >
                      {commentSending ? "Posting..." : "Post Comment"}
                    </button>
                  </div>

                  {commentMediaUrl && (
                    <div style={{ marginTop: 14 }}>
                      {commentMediaType === "image/gif" ? (
                        <img
                          src={commentMediaUrl}
                          style={{ maxWidth: 220, borderRadius: 14, display: "block" }}
                        />
                      ) : (
                        <img
                          src={commentMediaUrl}
                          style={{ maxWidth: 220, borderRadius: 14, display: "block" }}
                        />
                      )}
                    </div>
                  )}

                  {commentError && (
                    <div style={{ marginTop: 12, color: "#ff8f8f", fontSize: 14 }}>{commentError}</div>
                  )}
                </div>

                <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                  {commentsLoading[selectedImage.id] ? (
                    <div style={{ color: "rgba(255,255,255,0.7)" }}>Loading comments...</div>
                  ) : activeComments.length === 0 ? (
                    <div style={{ color: "rgba(255,255,255,0.62)" }}>No comments yet.</div>
                  ) : (
                    activeComments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.08)",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              color: "white",
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {comment.creator_avatar_url ? (
                              <img
                                src={comment.creator_avatar_url}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              (comment.creator_name || "R").slice(0, 1).toUpperCase()
                            )}
                          </div>

                          <div>
                            <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                              {comment.creator_name || "Realify User"}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.58)", fontSize: 12 }}>
                              {timeAgo(comment.created_at)}
                            </div>
                          </div>
                        </div>

                        {comment.body && (
                          <div
                            style={{
                              color: "rgba(255,255,255,0.82)",
                              fontSize: 14,
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {comment.body}
                          </div>
                        )}

                        {comment.media_url && (
                          <div style={{ marginTop: comment.body ? 10 : 0 }}>
                            <img
                              src={comment.media_url}
                              style={{
                                maxWidth: 240,
                                borderRadius: 14,
                                display: "block",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.62)" }}>Select an image to view details.</div>
          )}
        </div>

        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {images.map((img, i) => {
              const isSelected = selectedImage?.id === img.id;

              return (
                <button
                  key={img.id ?? `${img.image_url ?? "image"}-${i}`}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    ...cardStyle,
                    padding: 0,
                    overflow: "hidden",
                    textAlign: "left",
                    cursor: "pointer",
                    border: isSelected
                      ? "1px solid rgba(255,255,255,0.26)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <img
                    src={img.image_url}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <div style={{ padding: 14 }}>
                    <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
                      {img.creator_name || "Realify User"}
                    </div>

                    <div style={{ color: "rgba(255,255,255,0.58)", fontSize: 12, marginTop: 4 }}>
                      {timeAgo(img.created_at)}
                    </div>

                    <div
                      style={{
                        color: "rgba(255,255,255,0.74)",
                        fontSize: 13,
                        lineHeight: 1.5,
                        marginTop: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 38,
                      }}
                    >
                      {img.prompt || "No prompt available."}
                    </div>

                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div
                        style={{
                          padding: "8px 10px",
                          borderRadius: 12,
                          background: likedByUser[img.id] ? "#c1121f" : "rgba(255,255,255,0.06)",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ❤️ {likes[img.id] || 0}
                      </div>

                      <div
                        style={{
                          padding: "8px 10px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.06)",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {(comments[img.id] || []).length} comments
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
