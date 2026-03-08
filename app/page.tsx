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

  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  async function fetchGallery() {

    try {

      const res = await fetch('/api/gallery', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (data?.images?.length) setGallery(data.images);

    } catch {}
  }

  useEffect(() => {

    fetchGallery();

    if (user) {
      checkSubscription();
    }

  }, [user]);

  function handleImageUpload(files: FileList | null) {

    if (!files) return;

    setImages(Array.from(files));
  }

  async function generate() {

    if (!prompt.trim() || loading) return;

    setLoading(true);

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

        return alert('Generation failed.');
      }

      setResult(data.image);

      setGallery((prev) => [

        { image_url: data.image, prompt, created_at: Date.now() },

        ...prev,
      ]);

    } catch {

      alert('Network error.');
    }

    finally {

      setLoading(false);
    }
  }

  const ratios =
    model === 'nano'
      ? NANO_RATIOS
      : GPT_RATIOS;

  /* LANDING PAGE */

  if (!user) {

    return (

      <main style={{ maxWidth: 900, margin: 'auto', padding: 32 }}>

        <h1 style={{ fontSize: 42 }}>Realify</h1>

        <p style={{ fontSize: 18 }}>
          Create cinematic AI images instantly using advanced AI models.
        </p>

        <div style={{ marginTop: 20 }}>

          <button
            onClick={login}
            style={{
              padding: '10px 20px',
              fontSize: 16,
              background: '#111',
              color: '#fff',
              borderRadius: 6,
              marginRight: 10
            }}
          >
            Login with Google
          </button>

          <button
            onClick={() => window.location.href = '/explore'}
            style={{
              padding: '10px 20px',
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #ccc"
            }}
          >
            Explore Creations
          </button>

        </div>

      </main>
    );
  }

  if (hasSubscription === null) {

    return (

      <main style={{ maxWidth: 900, margin: 'auto', padding: 32 }}>

        <h1>Checking subscription...</h1>

      </main>
    );
  }

  /* GENERATOR */

  return (

    <main style={{ maxWidth: 900, margin: 'auto', padding: 32 }}>

      <h1>Realify</h1>

      <div style={{ marginBottom: 20 }}>

        <button onClick={logout} style={{ marginRight: 10 }}>
          Logout
        </button>

        <button
          onClick={() => window.location.href = '/billing'}
          style={{ marginRight: 10 }}
        >
          Manage Subscription
        </button>

        <button
          onClick={() => window.location.href = '/explore'}
        >
          Explore
        </button>

      </div>

      <h2>Generate</h2>

      <textarea
        rows={4}
        style={{ width: '100%', marginTop: 16 }}
        placeholder="Prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button onClick={generate}>

        {loading ? 'Generating...' : 'Generate'}

      </button>

      {result && (

        <>
          <h2>Latest Result</h2>

          <img
            src={result}
            style={{
              maxWidth: '100%',
              borderRadius: 10,
              marginTop: 10
            }}
          />

        </>
      )}

    </main>
  );
}
