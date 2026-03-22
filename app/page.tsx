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
        setErrorMessage(translateError(data?.error));
        return;
      }

      setResult(data.image);
      setRecentImages(prev => [data.image, ...prev].slice(0, 4));

    } catch {
      setErrorMessage("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const ratios = model === 'nano' ? NANO_RATIOS : GPT_RATIOS;

  if (!user) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Realify</h1>
        <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'10px 14px',borderRadius:8,color:'#fff',cursor:'pointer'}} onClick={login}>Login</button>
      </main>
    );
  }

  if (hasSubscription === null) {
    return <main style={{ padding: 40 }}>Checking...</main>;
  }

  return (
    <main style={{ padding: '80px 20px 20px 20px', maxWidth: 1200, margin: '0 auto' }}>

      {/* TOP NAV */}
      <div style={{
        position: 'absolute', top: 20, right: 20, display: 'flex',
        gap: 10,
        marginBottom: 20
      }}>
        <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'10px 14px',borderRadius:8,color:'#fff',cursor:'pointer'}} onClick={logout}>Logout</button>
        <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'10px 14px',borderRadius:8,color:'#fff',cursor:'pointer'}} onClick={() => window.location.href = '/billing'}>Billing</button>
        <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'10px 14px',borderRadius:8,color:'#fff',cursor:'pointer'}} onClick={() => window.location.href = '/explore'}>Explore</button>
        <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'10px 14px',borderRadius:8,color:'#fff',cursor:'pointer'}} onClick={() => window.location.href = '/history'}>History</button>
      </div>

      {/* MAIN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.6fr',
        gap: 30,
        alignItems: 'start'
      }}>

        {/* LEFT */}
        <div style={{
          background: 'rgba(15,15,20,0.75)', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(0,255,156,0.08) inset, 0 0 20px rgba(0,0,0,0.6)',
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)'
        }}>

          

          <textarea
            rows={4}
            style={{ width: '100%', marginTop: 10 }}
            placeholder="Describe your image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'10px 14px',borderRadius:8,color:'#fff',cursor:'pointer'}} onClick={generate} style={{ marginTop: 10 }}>
            {loading ? 'Generating...' : 'Generate'}
          </button>

          <button style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'10px 14px',borderRadius:8,color:'#fff',cursor:'pointer'}} onClick={() => setShowAdvanced(!showAdvanced)} style={{ marginTop: 10 }}>
            Advanced
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 10 }}>
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
          background: 'rgba(15,15,20,0.75)', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(0,255,156,0.08) inset, 0 0 20px rgba(0,0,0,0.6)',
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          minHeight: 600
        }}>

          {!result ? (
            <div style={{ opacity: 0.5, textAlign: 'center', marginTop: 100 }}>
              Your image will appear here
            </div>
          ) : (
            <img src={result} style={{ width: '100%' }} />
          )}

        </div>

      </div>

      {/* RECENT IMAGES */}
      {recentImages.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Recent</h3>
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10 }}>
            {recentImages.map((img, i) => (
              <img key={i} src={img} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
