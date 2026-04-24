"use client";

export default function LegalPage() {
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
    color: "rgba(255,255,255,0.68)",
    lineHeight: 1.7,
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

  const linkCard: React.CSSProperties = {
    ...cardStyle,
    cursor: "pointer",
    transition: "all 0.2s ease",
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
        <button onClick={() => (window.location.href = "/")} style={navButton}>
          ⌂ Home
        </button>
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
          Realify Legal
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
          Legal
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
          Review the Terms of Service and Privacy Policy that apply to your use of RealifyAI.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <div onClick={() => (window.location.href = "/legal/terms")} style={linkCard}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
            Terms of Service
          </div>
          <div style={mutedText}>
            Read the terms that govern account use, payments, content rules, and limitations of
            liability.
          </div>
        </div>

        <div onClick={() => (window.location.href = "/legal/privacy")} style={linkCard}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
            Privacy Policy
          </div>
          <div style={mutedText}>
            Learn what information we collect, how we use it, and how RealifyAI handles account,
            billing, and generation data.
          </div>
        </div>
      </div>
    </main>
  );
}
