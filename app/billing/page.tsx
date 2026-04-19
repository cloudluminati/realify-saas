"use client";

import { useEffect, useMemo, useState } from "react";

type SubscriptionData = {
  active: boolean;
  plan: string | null;
};

const LOCKED_MESSAGE =
  "Another plan can’t be purchased until your current subscription period ends. If you need more credits now, buy a credit bundle.";

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionData>({
    active: false,
    plan: null,
  });

  const [loadingPlan, setLoadingPlan] = useState<"starter" | "creator" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [bundleLoading, setBundleLoading] = useState<"small" | "medium" | "large" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/subscription-status", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();
        setSub({
          active: !!data?.active,
          plan: data?.plan ?? null,
        });
      } catch {
        setSub({
          active: false,
          plan: null,
        });
      }
    }

    loadStatus();
  }, []);

  const hasLockedSubscription = sub.active;
  const currentPlan = useMemo(() => (sub.plan ? sub.plan.toLowerCase() : null), [sub.plan]);

  const pageWrap: React.CSSProperties = {
    maxWidth: 1080,
    margin: "40px auto",
    padding: "20px",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.92)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 20,
    boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
    padding: 24,
  };

  const mutedText: React.CSSProperties = {
    color: "rgba(255,255,255,0.68)",
    lineHeight: 1.6,
  };

  const buttonBase: React.CSSProperties = {
    padding: "14px 18px",
    borderRadius: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const darkButton: React.CSSProperties = {
    ...buttonBase,
    background: "#171717",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
  };

  const lightButton: React.CSSProperties = {
    ...buttonBase,
    background: "white",
    color: "black",
    border: "none",
  };

  const disabledButton: React.CSSProperties = {
    ...buttonBase,
    background: "#111",
    color: "rgba(255,255,255,0.42)",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "not-allowed",
  };

  const openCancelFlow = async (customNotice?: string) => {
    if (portalLoading) return;

    if (customNotice) {
      setNotice(customNotice);
    }

    setPortalLoading(true);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "no_subscription") {
        alert("No active subscription found.");
        setPortalLoading(false);
      } else {
        alert("Unable to open cancellation flow.");
        setPortalLoading(false);
      }
    } catch {
      alert("Unable to open cancellation flow.");
      setPortalLoading(false);
    }
  };

  const handlePlanClick = async (plan: "starter" | "creator") => {
    setNotice(null);

    if (hasLockedSubscription) {
      setNotice(LOCKED_MESSAGE);
      return;
    }

    setLoadingPlan(plan);

    try {
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
        setLoadingPlan(null);
      }
    } catch {
      alert("Checkout failed");
      setLoadingPlan(null);
    }
  };

  const buyCredits = async (bundle: "small" | "medium" | "large") => {
    setNotice(null);
    setBundleLoading(bundle);

    try {
      const res = await fetch("/api/stripe/credits-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bundle }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "subscription_required") {
        alert("An active subscription is required to buy credit bundles.");
        setBundleLoading(null);
      } else {
        alert("Credit checkout failed.");
        setBundleLoading(null);
      }
    } catch {
      alert("Credit checkout failed.");
      setBundleLoading(null);
    }
  };

  return (
    <main style={pageWrap}>
      <div
        style={{
          ...cardStyle,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 700 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.82)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Realify Billing
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 48,
              lineHeight: 1,
              color: "white",
              letterSpacing: "-0.04em",
              fontWeight: 800,
            }}
          >
            Manage Subscription
          </h1>

          <p
            style={{
              margin: "14px 0 0",
              color: "rgba(255,255,255,0.72)",
              fontSize: 17,
              lineHeight: 1.6,
              maxWidth: 680,
            }}
          >
            Choose your plan, manage billing, and purchase extra credit bundles when needed.
          </p>
        </div>

        <div
          style={{
            minWidth: 280,
            maxWidth: 320,
            width: "100%",
            padding: "18px 18px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 12, marginBottom: 6 }}>
            Current plan
          </div>

          {sub.active ? (
            <>
              <div style={{ color: "white", fontWeight: 800, fontSize: 22, textTransform: "capitalize" }}>
                {currentPlan ?? "Active"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 13, marginTop: 6 }}>
                Subscription access is active on this account.
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "white", fontWeight: 800, fontSize: 22 }}>
                No active plan
              </div>
              <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 13, marginTop: 6 }}>
                Choose Starter or Creator to begin generating.
              </div>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: 18,
              marginBottom: 8,
            }}
          >
            Subscription locked
          </div>

          <div style={{ ...mutedText, color: "rgba(255,255,255,0.84)" }}>{notice}</div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.82)",
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            Starter
          </div>

          <div style={{ color: "white", fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
            $7.87
          </div>
          <div style={{ color: "rgba(255,255,255,0.62)", marginTop: 6 }}>per week</div>

          <div style={{ ...mutedText, marginTop: 18 }}>
            Fast, simple access for ongoing image generation.
          </div>

          <div style={{ marginTop: 22 }}>
            <button
              disabled={loadingPlan !== null || portalLoading}
              onClick={() => handlePlanClick("starter")}
              style={
                hasLockedSubscription
                  ? currentPlan === "starter"
                    ? disabledButton
                    : darkButton
                  : lightButton
              }
            >
              {loadingPlan === "starter"
                ? "Loading..."
                : hasLockedSubscription
                  ? currentPlan === "starter"
                    ? "Current Plan"
                    : "Locked Until Period Ends"
                  : "Choose Starter"}
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.82)",
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            Creator
          </div>

          <div style={{ color: "white", fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
            $29.99
          </div>
          <div style={{ color: "rgba(255,255,255,0.62)", marginTop: 6 }}>per month</div>

          <div style={{ ...mutedText, marginTop: 18 }}>
            Higher-volume access for heavier image generation use.
          </div>

          <div style={{ marginTop: 22 }}>
            <button
              disabled={loadingPlan !== null || portalLoading}
              onClick={() => handlePlanClick("creator")}
              style={
                hasLockedSubscription
                  ? currentPlan === "creator"
                    ? disabledButton
                    : darkButton
                  : lightButton
              }
            >
              {loadingPlan === "creator"
                ? "Loading..."
                : hasLockedSubscription
                  ? currentPlan === "creator"
                    ? "Current Plan"
                    : "Locked Until Period Ends"
                  : "Choose Creator"}
            </button>
          </div>
        </div>
      </div>

      {sub.active && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: 24,
              marginBottom: 8,
            }}
          >
            Buy Extra Credits
          </div>

          <div style={mutedText}>
            Need more generations before your current billing period ends? Purchase a one-time
            credit bundle below.
          </div>

          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.82)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Most images cost 2–10 credits depending on model and quality.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginTop: 18,
            }}
          >
            <button
              disabled={bundleLoading !== null}
              onClick={() => buyCredits("small")}
              style={bundleLoading === "small" ? disabledButton : darkButton}
            >
              {bundleLoading === "small" ? "Loading..." : "$5 - 100 credits"}
            </button>

            <button
              disabled={bundleLoading !== null}
              onClick={() => buyCredits("medium")}
              style={bundleLoading === "medium" ? disabledButton : darkButton}
            >
              {bundleLoading === "medium" ? "Loading..." : "$10 - 200 credits"}
            </button>

            <button
              disabled={bundleLoading !== null}
              onClick={() => buyCredits("large")}
              style={bundleLoading === "large" ? disabledButton : darkButton}
            >
              {bundleLoading === "large" ? "Loading..." : "$15 - 300 credits"}
            </button>
          </div>
        </div>
      )}

      {sub.active && (
        <div style={cardStyle}>
          <div
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 8,
            }}
          >
            Cancel Subscription
          </div>

          <div style={mutedText}>
            Cancel your current subscription in Stripe. Your access will remain active until the
            current billing period ends.
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => openCancelFlow()}
              disabled={portalLoading}
              style={portalLoading ? disabledButton : darkButton}
            >
              {portalLoading ? "Opening..." : "Cancel Current Subscription"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
