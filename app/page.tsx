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
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      setUser(null);
      return;
    }

    setUser(user ?? null);
  }

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    location.reload();
  }

  useEffect(() => {
    const initAuth = async () => {
      await new Promise(res => setTimeout(res, 100));
      await checkAuth();
    };

    initAuth();

    const { data: listener } =
      supabase.auth.onAuthStateChange(async (event) => {
        if (
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED'
        ) {
          await checkAuth();
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setHasSubscription(null);
        }
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
        setHasSubscription(false);
        return;
      }

      setHasSubscription(true);
    } catch {
      setHasSubscription(false);
    }
  }

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setHasSubscription(null);
    }
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

    if (!hasSubscription) {
      window.location.href = '/billing';
      return;
    }

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

  return <main>App Loaded</main>;
}
