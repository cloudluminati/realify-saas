'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type ModelChoice = 'nano' | 'gpt';
type QualityChoice = 'auto' | 'low' | 'medium' | 'high';

const NANO_RATIOS = [
  'match_input_image',
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
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

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);
  }

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

  useEffect(() => {
    checkAuth();

    const { data: listener } =
      supabase.auth.onAuthStateChange(() => {
        checkAuth();
      });

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
    if (user) {
      checkSubscription();
    }
  }, [user]);

  function handleImageUpload(files: FileList | null) {
    if (!files) return;
    setImages(Array.from(files));
  }

  function translateError(error: string) {
    if (error === "limit_reached") return "You don't have enough credits.";
    if (error === "servers_busy") return "Servers are busy. Try again in a moment.";
    if (error === "Too many requests") return "Please wait a few seconds before generating again.";
    if (error === "Generation already in progress") return "An image is already generating. Please wait.";
    if (error === "no_subscription") return "You need an active subscription.";
    return "Generation failed. Please try again.";
  }

  async function generate() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append('prompt', prompt);
      formData.append('aspectRatio', aspectRatio);
      formData.append('quality', quality);

      images.forEach((img) => formData.append('images', img));

      const endpoint = model === 'nano' ? '/api/realify' : '/api/gpt';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        const message = translateError(data?.error);
        setErrorMessage(message);
        return;
      }

      setResult(data.image);

    } catch {
      setErrorMessage("Network error. Please try again.");
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
    alert("Image link copied!");
  }

  const ratios = model === 'nano' ? NANO_RATIOS : GPT_RATIOS;

  if (!user) {
    return (
      <main style={{ maxWidth: 900, margin: 'auto', padding: 32 }}>
        <h1>Realify</h1>
        <p>Create cinematic AI images instantly.</p>
        <button onClick={login}>Login with Google</button>
      </main>
    );
  }

  if (hasSubscription === null) {
    return <main style={{ padding: 40 }}>Checking subscription...</main>;
  }

  return (
    <main>

      {/* NAV */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={logout}>Logout</button>
        <button onClick={() => window.location.href = '/billing'}>Billing</button>
        <button onClick={() => window.location.href = '/explore'}>Explore</button>
        <button onClick={() => window.location.href = '/history'}>History</button>
      </div>

      {/* GRID SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* LEFT PANEL */}
        <div>

          <textarea
            rows={4}
            placeholder="Describe your image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button onClick={generate}>
            {loading ? 'Generating...' : 'Generate Image'}
          </button>

          <div style={{ marginTop: 20 }}>
            <button onClick={() => setShowAdvanced(!showAdvanced)}>
              Advanced Settings
            </button>

            {showAdvanced && (
              <div style={{ marginTop: 15 }}>

                <div>
                  <label>Model</label>
                  <select value={model} onChange={(e) => setModel(e.target.value as ModelChoice)}>
                    <option value="nano">Nano Banana</option>
                    <option value="gpt">GPT Image</option>
                  </select>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label>Quality</label>
                  <select value={quality} onChange={(e) => setQuality(e.target.value as QualityChoice)}>
                    <option value="auto">Auto</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label>Aspect Ratio</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                    {ratios.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label>Reference Images</label>
                  <input type="file" multiple onChange={(e) => handleImageUpload(e.target.files)} />
                </div>

              </div>
            )}
          </div>

          {errorMessage && (
            <div style={{ marginTop: 20, color: "red" }}>
              {errorMessage}
            </div>
          )}

        </div>

        {/* RIGHT PANEL */}
        <div>

          {!result && (
            <div style={{
              height: 400,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6
            }}>
              Your image will appear here
            </div>
          )}

          {result && (
            <div>
              <img src={result} style={{ width: "100%" }} />

              <div style={{ marginTop: 15 }}>
                <button onClick={downloadImage}>Download</button>
                <button onClick={generate}>Generate Again</button>
                <button onClick={shareImage}>Share</button>
              </div>
            </div>
          )}

        </div>

      </div>

    </main>
  );
}
