'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type ModelChoice = 'nano' | 'gpt';
type QualityChoice = 'auto' | 'low' | 'medium' | 'high';

export default function Page() {
  const [user, setUser] = useState<any>(null);

  const [model, setModel] = useState<ModelChoice>('nano');
  const [quality, setQuality] = useState<QualityChoice>('auto');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isPrivate, setIsPrivate] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [recentImages, setRecentImages] = useState<{ image: string; prompt: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setRecentImages([]);
        setResult(null);
        setImages([]);
        setPrompt('');
        setError(null);
        setIsPrivate(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadRecent() {
      if (!user) {
        setRecentImages([]);
        return;
      }

      try {
        const res = await fetch('/api/gallery', {
          cache: 'no-store',
          credentials: 'include',
        });

        const data = await res.json();

        if (data?.images) {
          setRecentImages(
            data.images.slice(0, 4).map((img: any) => ({
              image: img.image_url,
              prompt: img.prompt || '',
            }))
          );
        } else {
          setRecentImages([]);
        }
      } catch {
        setRecentImages([]);
      }
    }

    loadRecent();
  }, [user]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setRecentImages([]);
      setResult(null);
      setImages([]);
      setPrompt('');
      setError(null);
      setIsPrivate(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      window.location.href = '/';
    }
  }

  function handleImageUpload(files: FileList | null) {
    if (!files) return;

    const selectedFiles = Array.from(files);
    const validImages = selectedFiles.filter((file) => file.type.startsWith('image/'));
    const invalidFiles = selectedFiles.filter((file) => !file.type.startsWith('image/'));

    if (invalidFiles.length > 0) {
      setError('Only image files are allowed for reference uploads.');
    } else {
      setError(null);
    }

    if (validImages.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setImages((prev) => {
      const combined = [...prev, ...validImages];

      return combined.filter((file, index, arr) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        return index === arr.findIndex((f) => `${f.name}-${f.size}-${f.lastModified}` === key);
      });
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function enhancePrompt() {
    if (!prompt.trim()) return;

    let improved = prompt.trim();

    if (improved.length < 40) {
      improved += ', detailed, high quality';
    }

    if (!/realistic|cinematic|illustration|anime|3d|photo|photography/i.test(improved)) {
      improved += ', realistic, natural lighting';
    }

    if (!/close-up|wide shot|portrait|angle|composition|framing/i.test(improved)) {
      improved += ', professional composition';
    }

    setPrompt(improved);
  }

  async function generate(overridePrompt?: string) {
    const finalPrompt = (overridePrompt ?? prompt).trim();

    if (!finalPrompt || loading) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('prompt', finalPrompt);
      formData.append('aspectRatio', aspectRatio);
      formData.append('isPrivate', isPrivate ? 'true' : 'false');

      if (model === 'gpt') {
        formData.append('quality', quality);
      }

      if (images.length > 0) {
        images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const endpoint = model === 'nano' ? '/api/realify' : '/api/gpt';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'no_subscription') {
          setError('No active plan. Go to Billing.');
        } else if (data.error === 'limit_reached') {
          setError("You're out of credits.");
        } else if (data.error === 'replicate_no_credit') {
          setError('Server is out of generation credits. Try again later.');
        } else if (data.error === 'invalid_file_type') {
          setError('Only image files are allowed for reference uploads.');
        } else if (data.error === 'Too many requests') {
          setError('Wait a couple seconds before trying again.');
        } else if (data.error === 'Generation already in progress') {
          setError('Image already generating...');
        } else {
          setError('Something went wrong. Try again.');
        }

        setLoading(false);
        return;
      }

      const img =
        data.image ||
        data.url ||
        (Array.isArray(data.output) ? data.output[0] : data.output);

      setResult(img);
      setRecentImages((prev) => [{ image: img, prompt: finalPrompt }, ...prev].slice(0, 4));
    } finally {
      setLoading(false);
    }
  }

  async function generateVariation() {
    if (!prompt.trim() || loading) return;

    const variations = [
      'different angle',
      'alternate pose',
      'cinematic variation',
      'new composition',
      'slight variation',
      'different lighting',
      'dynamic framing',
    ];

    const random = variations[Math.floor(Math.random() * variations.length)];
    const variedPrompt = `${prompt.trim()}, ${random}`;

    setPrompt(variedPrompt);
    await generate(variedPrompt);
  }

  function handleRetry() {
    setError(null);
  }

  if (!user) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Realify</h1>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
          Login
        </button>
      </main>
    );
  }

  const navButtonStyle: React.CSSProperties = {
    padding: '12px 22px',
    borderRadius: 16,
    background: 'rgba(8, 8, 8, 0.92)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(10, 10, 10, 0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    boxShadow: '0 20px 50px rgba(0,0,0,0.28)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  const infoBannerStyle: React.CSSProperties = {
    marginTop: 12,
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.84)',
    fontSize: 14,
    lineHeight: 1.5,
  };

  const toggleWrapStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const showBillingCta =
    error === 'No active plan. Go to Billing.' ||
    error === "You're out of credits." ||
    error === 'Server is out of generation credits. Try again later.';

  const showRetryCta =
    error === 'Wait a couple seconds before trying again.' ||
    error === 'Image already generating...' ||
    error === 'Something went wrong. Try again.' ||
    error === 'Only image files are allowed for reference uploads.';

  const modelLabel = model === 'nano' ? 'Nano' : 'GPT Image';
  const modelModeLabel = model === 'nano' ? 'Best for speed' : 'Best for quality';

  const referenceCount = images.length;
  const referenceLabel =
    referenceCount === 0
      ? 'No reference images'
      : referenceCount === 1
        ? '1 reference image attached'
        : `${referenceCount} reference images attached`;

  return (
    <main style={{ padding: '40px 40px 60px', maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          position: 'fixed',
          top: 22,
          right: 22,
          display: 'flex',
          gap: 12,
          zIndex: 20,
        }}
      >
        <button onClick={handleLogout} style={navButtonStyle}>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
        <button onClick={() => (window.location.href = '/billing')} style={navButtonStyle}>
          Billing
        </button>
        <button onClick={() => (window.location.href = '/explore')} style={navButtonStyle}>
          Explore
        </button>
        <button onClick={() => (window.location.href = '/history')} style={navButtonStyle}>
          History
        </button>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: '30px 32px',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 24,
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Realify Image Studio
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 64,
              lineHeight: 1,
              color: 'white',
              letterSpacing: '-0.04em',
              fontWeight: 800,
            }}
          >
            Realify
          </h1>

          <p
            style={{
              margin: '14px 0 0',
              color: 'rgba(255,255,255,0.72)',
              fontSize: 18,
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            Generate premium AI images, iterate fast with variations, and keep your best
            creations ready to download.
          </p>
        </div>

        <div
          style={{
            minWidth: 280,
            display: 'grid',
            gap: 10,
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>
              Current model
            </div>
            <div style={{ color: 'white', fontWeight: 700 }}>{modelLabel}</div>
            <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 12, marginTop: 4 }}>
              {modelModeLabel}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>
              Current aspect ratio
            </div>
            <div style={{ color: 'white', fontWeight: 700 }}>{aspectRatio}</div>
            {model === 'gpt' && (
              <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 12, marginTop: 4 }}>
                Quality: {quality}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>
              Reference images
            </div>
            <div style={{ color: 'white', fontWeight: 700 }}>{referenceLabel}</div>
            {referenceCount > 0 && (
              <button
                onClick={() => {
                  setImages([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.14)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          maxWidth: '100%',
          overflow: 'hidden',
          gridTemplateColumns: '420px 1fr',
          minWidth: 0,
          gap: 30,
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: 24,
            minWidth: 0,
          }}
        >
          <textarea
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: 140,
              padding: 16,
              borderRadius: 14,
              background: '#000',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 16,
              outline: 'none',
              resize: 'vertical',
            }}
            placeholder="Describe your image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button
            onClick={enhancePrompt}
            style={{
              marginTop: 12,
              width: '100%',
              padding: 12,
              borderRadius: 14,
              background: '#1a1a1a',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.14)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Enhance Prompt
          </button>

          <div
            style={{
              marginTop: 14,
              display: 'flex',
              gap: 10,
            }}
          >
            <button
              onClick={() => generate()}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                background: 'white',
                color: 'black',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                padding: '14px 18px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.16)',
                background: '#111',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Advanced
            </button>
          </div>

          {loading && (
            <div style={infoBannerStyle}>
              You can leave this page while your image finishes. Completed images will appear in
              Recent and History.
            </div>
          )}

          {showAdvanced && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelChoice)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: '#111',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <option value="nano">Nano</option>
                <option value="gpt">GPT</option>
              </select>

              {model === 'nano' ? (
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: '#111',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:5">4:5</option>
                  <option value="4:3">4:3</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                  <option value="21:9">21:9</option>
                  <option value="9:21">9:21</option>
                  <option value="match_input_image">match_input_image</option>
                </select>
              ) : (
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: '#111',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <option value="1:1">1:1</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                </select>
              )}

              {model === 'gpt' && (
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as QualityChoice)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: '#111',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <option value="auto">Auto</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              )}

              <div style={toggleWrapStyle}>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Private generation</div>
                  <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12, marginTop: 4 }}>
                    Private images stay in your History only and won’t appear in Explore.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: 'pointer',
                  }}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: '#111',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />

              <div
                style={{
                  marginTop: 2,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {images.length === 0
                  ? 'No reference images selected yet.'
                  : images.length === 1
                    ? `Attached: ${images[0].name}`
                    : `Attached ${images.length} images: ${images.map((image) => image.name).join(', ')}`}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            ...cardStyle,
            minWidth: 0,
            padding: 24,
            minHeight: 540,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {error ? (
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                borderRadius: 18,
                border: '1px solid rgba(255,120,120,0.22)',
                background: 'rgba(70, 12, 12, 0.35)',
                padding: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              }}
            >
              <div
                style={{
                  color: '#ff8f8f',
                  fontWeight: 800,
                  fontSize: 20,
                  marginBottom: 10,
                }}
              >
                Generation unavailable
              </div>

              <div
                style={{
                  color: 'rgba(255,255,255,0.84)',
                  fontSize: 16,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>

              {(showBillingCta || showRetryCta) && (
                <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {showBillingCta && (
                    <button
                      onClick={() => (window.location.href = '/billing')}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        background: 'white',
                        color: 'black',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      Go to Billing
                    </button>
                  )}

                  {showRetryCta && (
                    <button
                      onClick={handleRetry}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        background: '#1f1f1f',
                        color: 'white',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.16)',
                      }}
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : !result ? (
            <div style={{ opacity: 0.45, color: 'white', fontSize: 18 }}>
              {loading ? 'Generating...' : 'Your image will appear here'}
            </div>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
            >
              <img
                src={result}
                style={{
                  maxWidth: '100%',
                  maxHeight: '72vh',
                  borderRadius: 16,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={generateVariation}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 14,
                    background: '#1f1f1f',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.16)',
                  }}
                >
                  Variation
                </button>

                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `realify-${Date.now()}.png`;
                    link.click();
                  }}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 14,
                    background: 'white',
                    color: 'black',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {recentImages.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              ...cardStyle,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 14px', color: 'white', fontSize: 22 }}>Recent</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {recentImages.map((img, i) => (
                <img
                  key={`${img.image}-${i}`}
                  src={img.image}
                  onClick={() => {
                    setPrompt(img.prompt);
                    setResult(img.image);
                  }}
                  style={{
                    width: 110,
                    height: 110,
                    objectFit: 'cover',
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
