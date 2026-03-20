'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type ModelChoice = 'nano' | 'gpt';
type QualityChoice = 'auto' | 'low' | 'medium' | 'high';

const NANO_RATIOS = [
  'match_input_image',
  '1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9',
];

const GPT_RATIOS = ['1:1', '3:2', '2:3'];

export default function Page() {

  const [user, setUser] = useState<any>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);

  const [model, setModel] = useState<ModelChoice>('nano');
  const [quality, setQuality] = useState<QualityChoice>('auto');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const [images, setImages] = useState<File[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [recentImages, setRecentImages] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  }

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

  useEffect(() => {
    checkAuth();
    const { data: listener } =
      supabase.auth.onAuthStateChange(() => checkAuth());
    return () => listener.subscription.unsubscribe();
  }, []);

  async function checkSubscription() {
    try {
      const res = await fetch('/api/subscription-status', {
        cache: 'no-store',
        credentials: 'include',
      });

      const data = await res.json();

      if (!data.active) {
        window.location.href = '/billing';
        return;
      }

      setHasSubscription(true);

    } catch {
      window.location.href = '/billing';
    }
  }

  useEffect(() => {
    if (user) checkSubscription();
  }, [user]);

  function handleImageUpload(files: FileList | null) {
    if (!files) return;
    setImages(Array.from(files));
  }

  function translateError(error: string) {
    if (error === "limit_reached") return "You don't have enough credits.";
    if (error === "servers_busy") return "Servers are busy.";
    if (error === "Too many requests") return "Slow down.";
    if (error === "Generation already in progress") return "Already generating.";
    if (error === "no_subscription") return "You need a subscription.";
    return "Generation failed.";
  }

  async function generate() {

    if (!prompt.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {

      const formData = new FormData();

      formData.append('prompt', prompt);
      formData.append('aspectRatio', aspectRatio);
      formData.append('quality', quality);

      images.forEach((img) => formData.append('images', img));

      const endpoint =
        model === 'nano'
          ? '/api/realify'
          : '/api/gpt';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(translateError(data?.error));
        return;
      }

      setResult(data.image);

      setRecentImages((prev) => [data.image, ...prev.slice(0, 3)]);

    } catch {
      setErrorMessage("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function downloadImage() {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = 'realify-image.png';
    link.click();
  }

  function shareImage() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    alert("Copied!");
  }

  const ratios = model === 'nano' ? NANO_RATIOS : GPT_RATIOS;

  if (!user) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Realify</h1>
        <button onClick={login}>Login</button>
      </main>
    );
  }

  if (hasSubscription === null) {
    return <main style={{ padding: 40 }}>Checking...</main>;
  }

  return (

    <main style={{ padding: 30 }}>

      <div style={{
        position: 'fixed',
        top: 20,
        left: 20,
        display: 'flex',
        gap: 10,
        zIndex: 10
      }}>
        <button onClick={logout}>Logout</button>
        <button onClick={() => window.location.href = '/billing'}>Billing</button>
        <button onClick={() => window.location.href = '/explore'}>Explore</button>
        <button onClick={() => window.location.href = '/history'}>History</button>
      </div>

      <div style={{
        maxWidth: 1100,
        margin: 'auto',
        marginTop: 80,
        padding: 25,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(0,255,156,0.15)',
        backdropFilter: 'blur(12px)'
      }}>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '0.9fr 1.1fr',
          gap: 25
        }}>

          <div>

            <textarea
              rows={4}
              placeholder="Describe your image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 12,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(0,255,156,0.2)',
                color: 'white'
              }}
            />

            <button
              onClick={generate}
              style={{
                marginTop: 15,
                width: '100%',
                padding: 14,
                borderRadius: 12,
                background: 'linear-gradient(90deg,#00ff9c,#00c97a)',
                border: 'none',
                fontWeight: 600
              }}
            >
              {loading ? 'Generating...' : 'Generate Image'}
            </button>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                marginTop: 10,
                width: '100%',
                padding: 10,
                borderRadius: 10,
                background: 'transparent',
                border: '1px solid rgba(0,255,156,0.2)'
              }}
            >
              Advanced Settings
            </button>

            {showAdvanced && (
              <div style={{ marginTop: 15 }}>

                <select value={model} onChange={(e) => setModel(e.target.value as ModelChoice)}>
                  <option value="nano">Nano</option>
                  <option value="gpt">GPT</option>
                </select>

                <select value={quality} onChange={(e) => setQuality(e.target.value as QualityChoice)}>
                  <option value="auto">Auto</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                  {ratios.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>

                <input type="file" multiple onChange={(e) => handleImageUpload(e.target.files)} />

              </div>
            )}

            {errorMessage && (
              <div style={{ color: 'red', marginTop: 10 }}>
                {errorMessage}
              </div>
            )}

          </div>

          <div>

            {!result && (
              <div style={{
                width: '100%',
                height: 450,
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6
              }}>
                Your image will appear here
              </div>
            )}

            {result && (
              <div>
                <img src={result} style={{
                  width: '100%',
                  borderRadius: 16
                }} />

                <div style={{ marginTop: 10 }}>
                  <button onClick={downloadImage}>Download</button>
                  <button onClick={generate}>Again</button>
                  <button onClick={shareImage}>Share</button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {recentImages.length > 0 && (
        <div style={{
          maxWidth: 1100,
          margin: 'auto',
          marginTop: 30
        }}>

          <h3 style={{ marginBottom: 10 }}>Recent Images</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10
          }}>

            {recentImages.map((img, i) => (
              <img
                key={i}
                src={img}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  cursor: 'pointer'
                }}
                onClick={() => setResult(img)}
              />
            ))}

          </div>

        </div>
      )}

    </main>
  );
}
