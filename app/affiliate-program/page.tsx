"use client";

export default function AffiliateProgramPage() {
  const pageWrap: React.CSSProperties = {
    maxWidth: 1000,
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
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.7,
    fontSize: 15,
  };

  const navButton: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: 16,
    background: "#171717",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    fontWeight: 700,
    cursor: "pointer",
  };

  const primaryButton: React.CSSProperties = {
    padding: "14px 18px",
    borderRadius: 14,
    background: "white",
    color: "black",
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  };

  const sectionCard: React.CSSProperties = {
    ...cardStyle,
    height: "100%",
  };

  const emailLink: React.CSSProperties = {
    color: "white",
    textDecoration: "underline",
    fontWeight: 700,
  };

  return (
    <main style={pageWrap}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => (window.location.href = "/")} style={navButton}>
            ⌂ Home
          </button>
          <button onClick={() => (window.location.href = "/legal")} style={navButton}>
            Legal
          </button>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.82)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Realify Affiliate Program
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 46,
            lineHeight: 1,
            color: "white",
            letterSpacing: "-0.04em",
            fontWeight: 800,
          }}
        >
          Affiliate Program
        </h1>

        <p
          style={{
            margin: "14px 0 0",
            color: "rgba(255,255,255,0.72)",
            fontSize: 17,
            lineHeight: 1.7,
            maxWidth: 760,
          }}
        >
          Our affiliate program is coming soon. We’re preparing a simple referral system for
          creators and partners.
        </p>

        <div style={{ marginTop: 22 }}>
          <button
            onClick={() => (window.location.href = "mailto:affiliates@realifyapp.net")}
            style={primaryButton}
          >
            Email Affiliate Team
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <div style={sectionCard}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
            Coming Soon
          </div>
          <div style={mutedText}>
            We’re not accepting affiliate signups yet. Once it launches, we’ll add a simple signup
            flow and referral link system here.
          </div>
        </div>

        <div style={sectionCard}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
            Early Interest
          </div>
          <div style={mutedText}>
            If you want updates or early access when the affiliate system goes live, contact us at:
          </div>
          <div style={{ marginTop: 14 }}>
            <a href="mailto:affiliates@realifyapp.net" style={emailLink}>
              affiliates@realifyapp.net
            </a>
          </div>
        </div>

        <div style={sectionCard}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
            For Now
          </div>
          <div style={mutedText}>
            The affiliate page is currently informational only while we finish the system and
            finalize program details.
          </div>
        </div>
      </div>
    </main>
  );
}
