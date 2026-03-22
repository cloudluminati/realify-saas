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

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error) {
        setUser(null);
        return;
      }

      setUser(user ?? null);
    };

    init();

    const { data: listener } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED'
        ) {
          setUser(session?.user ?? null);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setHasSubscription(null);
        }
      });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

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

      if (!res.ok) return;

      setResult(data.image);
      setRecentImages(prev => [data.image, ...prev].slice(0, 4));

    } finally {
      setLoading(false);
    }
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
    <main style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto' }}>

      {/* NAV */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10 }}>
        <button onClick={logout}>Logout</button>
        <button onClick={() => window.location.href = '/billing'}>Billing</button>
        <button onClick={() => window.location.href = '/explore'}>Explore</button>
        <button onClick={() => window.location.href = '/history'}>History</button>
      </div>

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 30 }}>

        {/* LEFT */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(20,20,30,0.85), rgba(10,10,15,0.95))',
          padding: 24,
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.08)'
        }}>

          <textarea style={{display:'block',width:'100%',height:140,marginTop:0,padding:14,borderRadius:12,background:'rgba(0,0,0,0.4)',color:'#fff',border:'1px solid rgba(255,255,255,0.1)'}}
            style={{
              width: '100%',
              height: 140,
              borderRadius: 12,
              padding: 14,
              background: 'rgba(0,0,0,0.4)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            placeholder="Describe your image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={generate}>
              {loading ? 'Generating...' : 'Generate'}
            </button>

            <button onClick={() => setShowAdvanced(!showAdvanced)}>
              Advanced
            </button>
          </div>

          {showAdvanced && (
            <div style={{ marginTop: 16 }}>
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
                {ratios.map((r) => <option key={r}>{r}</option>)}
              </select>

              <input type="file" multiple onChange={(e) => handleImageUpload(e.target.files)} />
            </div>
          )}

        </div>

        {/* RIGHT */}
        <div style={{
          background: 'rgba(15,15,20,0.8)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.08)',
          minHeight: 600
        }}>
          {!result ? (
            <div style={{ opacity: 0.5, textAlign: 'center', marginTop: 120 }}>
              Your image will appear here
            </div>
          ) : (
            <img src={result} style={{ width: '100%', borderRadius: 12 }} />
          )}
        </div>

      </div>

      {/* RECENT */}
      {recentImages.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3>Recent</h3>

          <div style={{
            display: 'flex',
            gap: 14,
            marginTop: 14
          }}>
            {recentImages.map((img, i) => (
              <img
                key={i}
                src={img}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              />
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
