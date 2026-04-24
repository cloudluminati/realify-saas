"use client";

export default function PrivacyPage() {
  const pageWrap: React.CSSProperties = {
    maxWidth: 1100,
    margin: "40px auto",
    padding: "20px",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.92)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 20,
    boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
    padding: 28,
  };

  const mutedText: React.CSSProperties = {
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.8,
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

  const sectionTitle: React.CSSProperties = {
    color: "white",
    fontSize: 22,
    fontWeight: 800,
    margin: "30px 0 12px",
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
            ← Legal
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
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          RealifyAI Privacy Policy
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 42,
            lineHeight: 1,
            color: "white",
            letterSpacing: "-0.04em",
            fontWeight: 800,
          }}
        >
          Privacy Policy
        </h1>

        <p style={{ ...mutedText, marginTop: 16 }}>
          <strong>Last Updated:</strong> April 24, 2026
        </p>

        <p style={mutedText}>
          This Privacy Policy explains how RealifyAI (“RealifyAI,” “we,” “our,” or “us”) collects,
          uses, shares, and protects information when you access or use our website, applications,
          and related services (collectively, the “Services”).
        </p>

        <p style={mutedText}>By using the Services, you acknowledge this Privacy Policy.</p>

        <div style={sectionTitle}>1. Information We Collect</div>
        <p style={mutedText}>We may collect the following categories of information:</p>

        <p style={mutedText}>
          <strong>A. Account Information</strong>
          <br />
          When you create or use an account, we may collect your name, email address, and profile
          information provided through login providers such as Google.
        </p>

        <p style={mutedText}>
          <strong>B. Billing and Payment Information</strong>
          <br />
          If you purchase a subscription or credits, payments are processed by third-party payment
          providers. We may receive limited billing-related information such as payment status,
          subscription status, product or plan purchased, transaction identifiers, and billing
          events such as renewals, cancellations, refunds, or failed payments.
        </p>

        <p style={mutedText}>
          We do not store full payment card numbers on our own systems.
        </p>

        <p style={mutedText}>
          <strong>C. Inputs and Generated Content</strong>
          <br />
          When you use the Services, we may collect and store prompts, text instructions, uploaded
          reference images, generated images, generation history, and settings such as model choice,
          aspect ratio, quality, and private or public options.
        </p>

        <p style={mutedText}>
          <strong>D. Technical and Usage Information</strong>
          <br />
          We may automatically collect certain technical information, including IP address, browser
          type, device information, operating system, approximate location derived from IP, pages
          viewed, actions taken within the Services, timestamps, and logs relating to usage, errors,
          and security events.
        </p>

        <p style={mutedText}>
          <strong>E. Communications</strong>
          <br />
          If you contact us, we may collect your email address, the contents of your message, and
          any attachments or information you send to us.
        </p>

        <div style={sectionTitle}>2. How We Use Information</div>
        <p style={mutedText}>We may use your information to:</p>
        <ul style={mutedText}>
          <li>provide, operate, and maintain the Services;</li>
          <li>create and manage accounts;</li>
          <li>authenticate users;</li>
          <li>process subscriptions, credit purchases, and related billing activity;</li>
          <li>generate and store outputs;</li>
          <li>maintain galleries, history, and account features;</li>
          <li>improve performance, reliability, and user experience;</li>
          <li>monitor usage, detect abuse, enforce limits, and protect the Services;</li>
          <li>investigate violations of our Terms or other misuse;</li>
          <li>communicate with you about your account, purchases, updates, or support requests;</li>
          <li>comply with legal obligations.</li>
        </ul>

        <div style={sectionTitle}>3. How We Share Information</div>
        <p style={mutedText}>We may share information in the following situations:</p>

        <p style={mutedText}>
          <strong>A. Service Providers</strong>
          <br />
          We may share information with vendors and service providers that help us operate the
          Services, including providers for hosting and infrastructure, authentication, billing and
          payment processing, database and storage, analytics and logging, and AI/model generation
          services.
        </p>

        <p style={mutedText}>
          <strong>B. Legal Compliance and Protection</strong>
          <br />
          We may disclose information if we believe it is reasonably necessary to comply with
          applicable law, regulation, legal process, or government request; enforce our Terms or
          other policies; detect, investigate, or prevent fraud, abuse, security issues, or illegal
          activity; or protect the rights, safety, or property of RealifyAI, our users, or others.
        </p>

        <p style={mutedText}>
          <strong>C. Business Transfers</strong>
          <br />
          If RealifyAI is involved in a merger, acquisition, financing, sale of assets, or similar
          transaction, your information may be transferred as part of that transaction.
        </p>

        <div style={sectionTitle}>4. Third-Party Services</div>
        <p style={mutedText}>
          The Services may rely on or integrate with third-party providers. Those third parties may
          have their own privacy policies and practices. We are not responsible for third-party
          privacy practices.
        </p>

        <div style={sectionTitle}>5. Data Retention</div>
        <p style={mutedText}>
          We retain information for as long as reasonably necessary to provide the Services, maintain
          account features and history, complete billing and financial records, detect and prevent
          abuse or fraud, resolve disputes, and comply with legal obligations.
        </p>
        <p style={mutedText}>
          We may delete or anonymize information when we no longer need it for these purposes.
        </p>

        <div style={sectionTitle}>6. Security</div>
        <p style={mutedText}>
          We use reasonable administrative, technical, and organizational safeguards designed to
          protect information. However, no method of transmission over the internet or electronic
          storage is completely secure, and we cannot guarantee absolute security.
        </p>

        <div style={sectionTitle}>7. Your Choices</div>
        <p style={mutedText}>
          Depending on how the Services are configured, you may be able to update certain account
          information, manage certain content settings, cancel subscriptions, and contact us to
          request account assistance or deletion-related help.
        </p>
        <p style={mutedText}>
          You may choose not to provide certain information, but some features of the Services may
          not work without it.
        </p>

        <div style={sectionTitle}>8. Children’s Privacy</div>
        <p style={mutedText}>
          The Services are not intended for anyone under 18 years old. We do not knowingly collect
          personal information from children under 18. If you believe a child has provided personal
          information to us, contact us and we will review the request.
        </p>

        <div style={sectionTitle}>9. International Use</div>
        <p style={mutedText}>
          If you access the Services from outside the United States, you understand that your
          information may be transferred to and processed in the United States or other jurisdictions
          where our service providers operate.
        </p>

        <div style={sectionTitle}>10. Changes to This Privacy Policy</div>
        <p style={mutedText}>
          We may update this Privacy Policy from time to time. If we make material changes, we may
          provide notice by updating the date above, posting notice through the Services, emailing
          users, or taking other appropriate steps.
        </p>
        <p style={mutedText}>
          Your continued use of the Services after changes take effect constitutes acceptance of the
          updated Privacy Policy.
        </p>

        <div style={sectionTitle}>11. Contact Us</div>
        <p style={mutedText}>
          <strong>Support:</strong> support@realifyapp.net
          <br />
          <strong>Affiliate inquiries:</strong> affiliates@realifyapp.net
        </p>
      </div>
    </main>
  );
}
