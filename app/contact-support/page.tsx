"use client";

export default function ContactSupportPage() {
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
          Realify Support
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
          Contact / Support
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
          Need help with billing, account access, generations, or general questions? Reach out and
          we’ll get back to you as soon as possible.
        </p>

        <div style={{ marginTop: 22 }}>
          <button
            onClick={() => (window.location.href = "mailto:support@realifyapp.net")}
            style={primaryButton}
          >
            Email Support
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
            Support Email
          </div>
          <div style={mutedText}>
            For account help, billing questions, generation issues, or copyright-related concerns,
            contact:
          </div>
          <div style={{ marginTop: 14 }}>
            <a href="mailto:support@realifyapp.net" style={emailLink}>
              support@realifyapp.net
            </a>
          </div>
        </div>

        <div style={sectionCard}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
            Affiliate Inquiries
          </div>
          <div style={mutedText}>
            Our affiliate program is coming soon. For affiliate-related questions, contact:
          </div>
          <div style={{ marginTop: 14 }}>
            <a href="mailto:affiliates@realifyapp.net" style={emailLink}>
              affiliates@realifyapp.net
            </a>
          </div>
        </div>

        <div style={sectionCard}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
            What to Include
          </div>
          <div style={mutedText}>
            To help us respond faster, include the email on your account and a short description of
            the issue. If your problem is billing-related, include the plan or bundle involved.
          </div>
        </div>
      </div>
    </main>
  );
}
