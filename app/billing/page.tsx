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
    if (!sub.active) {
      alert("You must have an active subscription to purchase credits.");
      return;
    }

    const res = await fetch("/api/stripe/credits-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Manage Subscription</h1>

      {/* CURRENT PLAN */}

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "8px",
          marginTop: "30px",
        }}
      >
        <h3>Current Plan</h3>

        {sub.active ? (
          <p>
            <strong>Plan:</strong> {sub.plan}
          </p>
        ) : (
          <p>You do not currently have an active subscription.</p>
        )}
      </div>

      {/* PLANS */}

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "8px",
          marginTop: "30px",
        }}
      >
        <h3>Available Plans</h3>

        <div style={{ marginTop: "20px" }}>
          <h4>Starter</h4>
          <p>$7.87 / week</p>

          <button
            disabled={loading || sub.plan === "starter"}
            onClick={() => upgradePlan("starter")}
            style={{ marginTop: "10px" }}
          >
            {sub.plan === "starter" ? "Current Plan" : "Select Starter"}
          </button>
        </div>

        <hr style={{ margin: "25px 0" }} />

        <div>
          <h4>Creator</h4>
          <p>$29.99 / month</p>

          <button
            disabled={loading || sub.plan === "creator"}
            onClick={() => upgradePlan("creator")}
            style={{ marginTop: "10px" }}
          >
            {sub.plan === "creator" ? "Current Plan" : "Select Creator"}
          </button>
        </div>
      </div>

      {/* CREDIT BUNDLES */}

      {sub.active && (
        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "30px",
          }}
        >
          <h3>Buy Extra Credits</h3>

          <p>
            Need more generations? Purchase additional credits that stack with
            your subscription.
          </p>

          <div style={{ marginTop: "20px" }}>
            <h4>$5 Bundle</h4>
            <p>≈100 credits</p>

            <button onClick={() => buyCredits("small")}>
              Buy $5 Credits
            </button>
          </div>

          <hr style={{ margin: "25px 0" }} />

          <div>
            <h4>$10 Bundle</h4>
            <p>≈200 credits</p>

            <button onClick={() => buyCredits("medium")}>
              Buy $10 Credits
            </button>
          </div>

          <hr style={{ margin: "25px 0" }} />

          <div>
            <h4>$15 Bundle</h4>
            <p>≈300 credits</p>

            <button onClick={() => buyCredits("large")}>
              Buy $15 Credits
            </button>
          </div>
        </div>
      )}

      {/* BILLING SETTINGS */}

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "8px",
          marginTop: "30px",
        }}
      >
        <h3>Billing Settings</h3>

        <p>
          Update payment method or cancel your subscription through Stripe.
        </p>

        <button onClick={openPortal} style={{ marginTop: "10px" }}>
          Manage Payment / Cancel Subscription
        </button>
      </div>
    </div>
  );
}
