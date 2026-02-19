'use client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
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
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
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
      setHasSubscription(!!data.active);
    } catch {
      setHasSubscription(false);
    }
  }

  async function upgrade(plan: 'starter' | 'creator') {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed.');
      }
    } catch {
      alert('Checkout error.');
    }
  }

  async function manageSubscription() {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to open billing portal.');
      }
    } catch {
      alert('Portal error.');
    }
  }

  async function fetchGallery() {
    try {
      const res = await fetch('/api/gallery', {
        cache: 'no-store',
        credentials: 'include',
      });

      const data = await res.json();
      if (data?.images?.length) setGallery(data.images);
    } catch {}
  }

  useEffect(() => {
    checkSubscription();
    fetchGallery();
  }, [user]);

  function handleImageUpload(files: FileList | null) {
    if (!files) return;
    setImages(Array.from(files));
  }

  async function generate() {
    if (!user) return alert('Login required.');
    if (!hasSubscription) return alert('Subscription required.');
    if (!prompt.trim() || loading) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('aspectRatio', aspectRatio);
      formData.append('quality', quality);
      images.forEach(img => formData.append('images', img));

      const endpoint = model === 'nano' ? '/api/realify' : '/api/gpt';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) return alert(data.error || 'Usage limit reached.');
        if (res.status === 503) return alert('Service temporarily unavailable.');
        return alert('Generation failed.');
      }

      setResult(data.image);

      setGallery(prev => [
        { image_url: data.image, prompt, created_at: Date.now() },
        ...prev,
      ]);

      setTimeout(fetchGallery, 2000);
    } catch {
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  }

  const ratios = model === 'nano' ? NANO_RATIOS : GPT_RATIOS;

  return (
    <main style={{ maxWidth: 900, margin: 'auto', padding: 32 }}>
      <h1>Realify</h1>

      {!user ? (
        <button onClick={login}>Login</button>
      ) : (
        <button onClick={logout}>Logout</button>
      )}

      {user && (
        <div style={{ margin: '20px 0' }}>
          <h3>Plans</h3>

          {hasSubscription ? (
            <>
              <p style={{ color: 'green' }}>
                Active subscription detected.
              </p>

              <button
                onClick={manageSubscription}
                style={{
                  marginBottom: 10,
                  background: '#111',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 6,
                }}
              >
                Manage Subscription
              </button>

              <p style={{ fontSize: 13, opacity: 0.7 }}>
                Upgrade, downgrade or cancel inside Manage Subscription.
              </p>
            </>
          ) : (
            <>
              <button onClick={() => upgrade('starter')}>
                Starter — $7.87/week
              </button>

              <button onClick={() => upgrade('creator')} style={{ marginLeft: 10 }}>
                Creator — $29.99/month
              </button>
            </>
          )}
        </div>
      )}

      <h2>Generate</h2>

      <select
        value={model}
        onChange={(e) => {
          const newModel = e.target.value as ModelChoice;
          setModel(newModel);
          setAspectRatio(newModel === 'nano' ? 'match_input_image' : '1:1');
        }}
      >
        <option value="nano">Nano</option>
        <option value="gpt">GPT</option>
      </select>

      {model === 'gpt' && (
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as QualityChoice)}
        >
          <option value="auto">Auto</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      )}

      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
        {ratios.map(r => <option key={r}>{r}</option>)}
      </select>

      <textarea
        rows={4}
        style={{ width: '100%', marginTop: 16 }}
        placeholder="Prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleImageUpload(e.target.files)}
      />

      <button onClick={generate}>
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {result && (
        <>
          <h2>Latest Result</h2>
          <img src={result} style={{ maxWidth: '100%' }} />
        </>
      )}
    </main>
  );
}

