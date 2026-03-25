"use client";

import { useEffect, useState } from "react";

type SubscriptionData = {
  active: boolean;
  plan: string | null;
};

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionData>({
    active: false,
    plan: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const res = await fetch("/api/subscription-status", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      setSub(data);
    }

    loadStatus();
  }, []);

  const upgradePlan = async (plan: "starter" | "creator") => {
    const confirmed = confirm(
      "Changing plans will cancel your current subscription and start a new billing cycle immediately.\n\nRemaining credits will stay on your account."
    );

    if (!confirmed) return;

    setLoading(true);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed");
      setLoading(false);
    }
  };

  const buyCredits = async (bundle: "small" | "medium" | "large") => {
    const res = await fetch("/api/stripe/credits-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ bundle }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Credit checkout failed.");
    }
  };

  const openPortal = async () => {
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Unable to open billing portal.");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <h1>Manage Subscription</h1>

      <div style={{ marginTop: 30 }}>
        <h3>Current Plan</h3>
        {sub.active ? (
          <p>
            <strong>Plan:</strong> {sub.plan}
          </p>
        ) : (
          <p>No active subscription</p>
        )}
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Available Plans</h3>

        <div style={{ marginTop: 10 }}>
          <button disabled={loading} onClick={() => upgradePlan("starter")}>
            Starter - $7.87/week
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <button disabled={loading} onClick={() => upgradePlan("creator")}>
            Creator - $29.99/month
          </button>
        </div>
      </div>

      {sub.active && (
        <div style={{ marginTop: 30 }}>
          <h3>Buy Extra Credits</h3>

          <button onClick={() => buyCredits("small")}>
            $5 - 100 credits
          </button>

          <button onClick={() => buyCredits("medium")}>
            $10 - 200 credits
          </button>

          <button onClick={() => buyCredits("large")}>
            $15 - 300 credits
          </button>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <button onClick={openPortal}>
          Manage Payment / Cancel
        </button>
      </div>
    </div>
  );
}
