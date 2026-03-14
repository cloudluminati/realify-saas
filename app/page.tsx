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

    if (error === "limit_reached") {
      return "You don't have enough credits.";
    }

    if (error === "servers_busy") {
      return "Servers are busy. Try again in a moment.";
    }

    if (error === "Too many requests") {
      return "Please wait a few seconds before generating again.";
    }

    if (error === "Generation already in progress") {
      return "An image is already generating. Please wait.";
    }

    if (error === "no_subscription") {
      return "You need an active subscription.";
    }

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

  const ratios = model === 'nano' ? NANO_RATIOS : GPT_RATIOS;

  if (!user) {

    return (

      <main style={{ maxWidth: 900, margin: 'auto', padding: 32 }}>

        <h1 style={{ fontSize: 42 }}>Realify</h1>

        <p style={{ fontSize: 18 }}>
          Create cinematic AI images instantly.
        </p>

        <button
          onClick={login}
          style={{
            padding: '10px 20px',
            background: '#111',
            color: '#fff',
            borderRadius: 6
          }}
        >
          Login with Google
        </button>

      </main>

    );

  }

  if (hasSubscription === null) {

    return (

      <main style={{ padding: 40 }}>
        Checking subscription...
      </main>

    );

  }

  return (

    <main style={{ maxWidth: 900, margin: 'auto', padding: 32 }}>

      <h1>Realify Generator</h1>

      <div style={{ marginBottom: 20 }}>

        <button
          onClick={logout}
          style={{ marginRight: 10 }}
        >
          Logout
        </button>

        <button
          onClick={() => window.location.href = '/billing'}
          style={{ marginRight: 10 }}
        >
          Billing
        </button>

        <button
          onClick={() => window.location.href = '/explore'}
          style={{ marginRight: 10 }}
        >
          Explore
        </button>

        <button
          onClick={() => window.location.href = '/history'}
        >
          History
        </button>

      </div>

      <div style={{ marginTop: 20 }}>

        <label>Model</label>

        <select
          value={model}
          onChange={(e) => setModel(e.target.value as ModelChoice)}
        >

          <option value="nano">Nano Banana</option>
          <option value="gpt">GPT Image</option>

        </select>

      </div>

      <div style={{ marginTop: 20 }}>

        <label>Quality</label>

        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as QualityChoice)}
        >

          <option value="auto">Auto</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>

        </select>

      </div>

      <div style={{ marginTop: 20 }}>

        <label>Aspect Ratio</label>

        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >

          {ratios.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}

        </select>

      </div>

      <div style={{ marginTop: 20 }}>

        <label>Reference Images</label>

        <input
          type="file"
          multiple
          onChange={(e) => handleImageUpload(e.target.files)}
        />

      </div>

      <textarea
        rows={4}
        style={{ width: '100%', marginTop: 20 }}
        placeholder="Describe your image..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={generate}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          background: "#111",
          color: "#fff",
          borderRadius: 6
        }}
      >

        {loading ? 'Generating...' : 'Generate Image'}

      </button>

      {errorMessage && (

        <div style={{ marginTop: 20, color: "red" }}>
          {errorMessage}
        </div>

      )}

      {result && (

        <div style={{ marginTop: 30 }}>

          <h2>Result</h2>

          <img
            src={result}
            style={{
              width: "100%",
              borderRadius: 10
            }}
          />

        </div>

      )}

    </main>

  );
}
