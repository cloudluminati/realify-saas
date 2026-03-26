'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type ModelChoice = 'nano' | 'gpt';
type QualityChoice = 'auto' | 'low' | 'medium' | 'high';

export default function Page() {

  const [user, setUser] = useState<any>(null);

  const [model, setModel] = useState<ModelChoice>('nano');
  const [quality, setQuality] = useState<QualityChoice>('auto');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const [images, setImages] = useState<File[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [recentImages, setRecentImages] = useState<{image:string,prompt:string}[]>([]);

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null); // ✅ added

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch("/api/gallery", { cache: "no-store" });
        const data = await res.json();

        if (data?.images) {
          setRecentImages(
            data.images.slice(0, 4).map((img: any) => ({
              image: img.image_url,
              prompt: img.prompt || ""
            }))
          );
        }
      } catch {}
    }

    loadRecent();
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
    }
    init();
  }, []);

  function handleImageUpload(files: FileList | null) {
    if (!files) return;
    setImages(Array.from(files));
  }

  async function generate() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setError(null); // ✅ reset error

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('aspectRatio', aspectRatio);

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

      // ✅ HANDLE ERRORS
      if (!res.ok) {
        if (data.error === "no_subscription") {
          setError("No active plan. Go to Billing.");
        } else if (data.error === "limit_reached") {
          setError("You're out of credits.");
        } else if (data.error === "Too many requests") {
          setError("Wait a couple seconds before trying again.");
        } else if (data.error === "Generation already in progress") {
          setError("Image already generating...");
        } else {
          setError("Something went wrong. Try again.");
        }

        setLoading(false);
        return;
      }

      const img =
        data.image ||
        data.url ||
        (Array.isArray(data.output) ? data.output[0] : data.output);

      setResult(img);
      setRecentImages(prev => [{ image: img, prompt }, ...prev].slice(0, 4));

    } finally {
      setLoading(false);
    }
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

  return (
    <main style={{ padding: 40, maxWidth: 1400, margin: '0 auto' }}>

      {/* NAV */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        gap: 10
      }}>
        <button onClick={() => supabase.auth.signOut()}>Logout</button>
        <button onClick={() => window.location.href = '/billing'}>Billing</button>
        <button onClick={() => window.location.href = '/explore'}>Explore</button>
        <button onClick={() => window.location.href = '/history'}>History</button>
      </div>

      {/* GRID */}
      <div style={{
        display: 'grid', maxWidth: '100%', overflow: 'hidden',
        gridTemplateColumns: '420px 1fr', minWidth: 0,
        gap: 30
      }}>

        {/* LEFT PANEL */}
        <div style={{
          background: '#0b0b0b',
          padding: 24,
          borderRadius: 16, minWidth: 0,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>

          <textarea
            style={{
              width: '100%', boxSizing: 'border-box',
              height: 140,
              padding: 12,
              borderRadius: 10,
              background: '#000',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            placeholder="Describe your image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div style={{
            marginTop: 14,
            display: 'flex',
            gap: 10
          }}>
            <button
              onClick={generate}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                background: 'white',
                color: 'black',
                fontWeight: 600
              }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white'
              }}
            >
              Advanced
            </button>
          </div>

          {showAdvanced && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

              <select value={model} onChange={(e) => setModel(e.target.value as ModelChoice)}>
                <option value="nano">Nano</option>
                <option value="gpt">GPT</option>
              </select>

              {model === "nano" ? (
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
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
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                  <option value="1:1">1:1</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                </select>
              )}

              {model === "gpt" && (
                <select value={quality} onChange={(e) => setQuality(e.target.value as QualityChoice)}>
                  <option value="auto">Auto</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              )}

              <input type="file" multiple onChange={(e) => handleImageUpload(e.target.files)} />

            </div>
          )}

        </div>

        {/* RIGHT PANEL */}
        <div style={{
          background: '#0b0b0b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, minWidth: 0,
          padding: 20,
          minHeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {error ? ( // ✅ error UI
            <div style={{ color: 'red', fontWeight: 500 }}>
              {error}
            </div>
          ) : !result ? (
            <div style={{ opacity: 0.4, color: 'white' }}>
              {loading ? "Generating..." : "Your image will appear here"}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              
              <img
                src={result}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: 12
                }}
              />

              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = result;
                  link.download = `realify-${Date.now()}.png`;
                  link.click();
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: 'white',
                  color: 'black',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Download
              </button>

            </div>
          )}
        </div>

      </div>

      {/* RECENT */}
      {recentImages.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ marginBottom: 10 }}>Recent</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            {recentImages.map((img, i) => (
              <img
                key={i}
                src={img.image}
                onClick={() => {
                  setPrompt(img.prompt);
                  setResult(img.image);
                }}
                style={{
                  width: 110,
                  height: 110,
                  objectFit: 'cover',
                  borderRadius: 10,
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
