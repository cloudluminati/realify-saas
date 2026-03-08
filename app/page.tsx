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

      if (data?.images?.length) {

        setGallery(data.images);
      }

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

        <button
          onClick={login}
          style={{
            marginTop: 40,
            padding: '10px 20px',
            fontSize: 16,
            background: '#111',
            color: '#fff',
            borderRadius: 6,
          }}
        >
          Login with Google
        </button>

        <h2 style={{ marginTop: 60 }}>Recent Creations</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
            gap: 12,
            marginTop: 20,
          }}
        >
          {gallery.map((img, i) => (

            <img
              key={i}
              src={img.image_url}
              style={{
                width: '100%',
                borderRadius: 8,
                objectFit: 'cover',
              }}
            />

          ))}
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

      <button onClick={logout}>Logout</button>

      <div style={{ margin: '20px 0' }}>

        <button
          onClick={() => (window.location.href = '/billing')}
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

          <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>

            <a
              href={result}
              download="realify-image.png"
              style={{
                padding: "8px 14px",
                background: "#111",
                color: "#fff",
                borderRadius: 6,
                textDecoration: "none"
              }}
            >
              Download Image
            </a>

            <button
              onClick={() => {

                navigator.clipboard.writeText(prompt);

                alert("Prompt copied!");

              }}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid #ccc"
              }}
            >
              Copy Prompt
            </button>

          </div>
        </>
      )}

      <h2 style={{ marginTop: 40 }}>Prompt History</h2>

      <div style={{ marginTop: 10 }}>

        {gallery.slice(0,10).map((img,i)=>(

          <div
            key={i}
            style={{
              display:'flex',
              justifyContent:'space-between',
              borderBottom:'1px solid #eee',
              padding:'6px 0'
            }}
          >

            <span style={{ fontSize:13 }}>
              {img.prompt}
            </span>

            <button
              onClick={()=>setPrompt(img.prompt)}
              style={{
                fontSize:12,
                border:'1px solid #ccc',
                borderRadius:4,
                padding:'2px 6px'
              }}
            >
              Use
            </button>

          </div>

        ))}

      </div>

      <h2 style={{ marginTop: 50 }}>Recent Creations</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >

        {gallery.map((img, i) => (

          <img
            key={i}
            src={img.image_url}
            style={{
              width: '100%',
              borderRadius: 8,
              objectFit: 'cover',
            }}
          />

        ))}

      </div>

    </main>
  );
}
