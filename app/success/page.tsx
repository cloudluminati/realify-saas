'use client';

import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      window.location.href = '/';
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, []);

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 700,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1>🎉 Payment Successful</h1>

      <p style={{ marginTop: 16, fontSize: 18 }}>
        Your plan has been activated.
      </p>

      <p style={{ marginTop: 8, color: '#666' }}>
        You can now continue generating images in Realify.
      </p>

      <div style={{ marginTop: 24 }}>
        Redirecting you back in <strong>{seconds}</strong> seconds…
      </div>

      <button
        style={{ marginTop: 32 }}
        onClick={() => (window.location.href = '/')}
      >
        Go back now
      </button>
    </main>
  );
}

