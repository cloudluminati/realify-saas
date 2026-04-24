"use client";

export default function TermsPage() {
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
          RealifyAI Terms of Service
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
          Terms of Service
        </h1>

        <p style={{ ...mutedText, marginTop: 16 }}>
          <strong>Last Updated:</strong> April 24, 2026
        </p>

        <p style={mutedText}>
          These Terms of Service (“Terms”) govern your access to and use of the RealifyAI website,
          applications, and related services (collectively, the “Services”) provided by RealifyAI
          (“RealifyAI,” “we,” “our,” or “us”).
        </p>

        <p style={mutedText}>
          By creating an account, purchasing a subscription or credits, accessing, or using the
          Services, you agree to these Terms. If you do not agree, do not use the Services.
        </p>

        <div style={sectionTitle}>1. Eligibility</div>
        <p style={mutedText}>You must be at least 18 years old to use the Services.</p>
        <p style={mutedText}>
          By using the Services, you represent and warrant that you are legally able to enter into
          these Terms, that the information you provide is accurate and current, and that you will
          use the Services only in compliance with these Terms and applicable law.
        </p>

        <div style={sectionTitle}>2. Accounts</div>
        <p style={mutedText}>
          You may need an account to use some or all features of the Services. You are responsible
          for maintaining the security of your account, all activity under your account, and
          notifying us promptly if you believe your account has been accessed without authorization.
        </p>
        <p style={mutedText}>
          We may suspend, restrict, or terminate your account if we believe you violated these
          Terms, created risk, used the Services unlawfully, or engaged in fraud, abuse, or misuse.
        </p>

        <div style={sectionTitle}>3. The Services</div>
        <p style={mutedText}>
          RealifyAI provides AI-powered image generation tools and related features, which may
          include prompt-based generation, reference image uploads, galleries, history, private
          generation settings, subscriptions, credit purchases, and related functionality.
        </p>
        <p style={mutedText}>
          We may modify, suspend, remove, or discontinue all or part of the Services at any time.
        </p>

        <div style={sectionTitle}>4. Billing, Subscriptions, and Credits</div>
        <p style={mutedText}>Some features require payment.</p>
        <p style={mutedText}>
          By purchasing a subscription, you authorize recurring charges to your selected payment
          method until you cancel. By purchasing credits or credit bundles, you authorize a one-time
          charge.
        </p>
        <p style={mutedText}>Unless otherwise stated:</p>
        <ul style={mutedText}>
          <li>subscriptions renew automatically unless canceled;</li>
          <li>one-time credit purchases do not renew automatically;</li>
          <li>credits or units may be consumed when generations are processed;</li>
          <li>
            canceled subscriptions remain active until the end of the current billing period unless
            otherwise stated;
          </li>
          <li>pricing, plan features, credits, and usage limits may change prospectively.</li>
        </ul>
        <p style={mutedText}>
          Payments are processed by third-party providers. We do not store full payment card
          information on our own systems.
        </p>
        <p style={mutedText}>
          <strong>Refunds:</strong> Except where required by law, all purchases are final and
          non-refundable.
        </p>

        <div style={sectionTitle}>5. User Inputs and Outputs</div>
        <p style={mutedText}>
          You may provide prompts, text, reference images, uploads, instructions, or other
          materials to the Services (“Inputs”). The Services may generate images or related results
          based on your Inputs (“Outputs”).
        </p>
        <p style={mutedText}>As between you and RealifyAI:</p>
        <ul style={mutedText}>
          <li>you retain ownership of Inputs you already own;</li>
          <li>
            you are responsible for ensuring you have all rights, permissions, and consents needed
            to submit your Inputs;
          </li>
          <li>you are responsible for how you use Outputs.</li>
        </ul>
        <p style={mutedText}>You understand and agree that:</p>
        <ul style={mutedText}>
          <li>Outputs may be inaccurate, incomplete, or unexpected;</li>
          <li>Outputs may resemble content created for other users;</li>
          <li>
            Outputs may implicate copyright, trademark, privacy, publicity, or other legal rights;
          </li>
          <li>
            RealifyAI does not guarantee that any Output is unique, lawful, non-infringing, or fit
            for your intended use.
          </li>
        </ul>
        <p style={mutedText}>
          You should independently review Outputs before publishing, sharing, selling, relying on,
          or using them commercially.
        </p>

        <div style={sectionTitle}>6. Prohibited Uses</div>
        <p style={mutedText}>
          You may not use the Services to create, upload, request, distribute, or facilitate
          content that:
        </p>
        <ul style={mutedText}>
          <li>violates any law or regulation;</li>
          <li>
            infringes or misappropriates any intellectual property, privacy, publicity, or other
            rights;
          </li>
          <li>contains child sexual abuse material or sexual content involving minors;</li>
          <li>depicts or promotes non-consensual sexual content, exploitation, or abuse;</li>
          <li>
            is fraudulent, deceptive, defamatory, threatening, harassing, hateful, or unlawful;
          </li>
          <li>is intended to impersonate another person in a misleading or harmful way;</li>
          <li>is used for scams, phishing, spam, malware, or abusive automation;</li>
          <li>is designed to bypass safeguards, billing systems, rate limits, or access controls.</li>
        </ul>
        <p style={mutedText}>You also may not:</p>
        <ul style={mutedText}>
          <li>access another user’s account without permission;</li>
          <li>reverse engineer, scrape, or interfere with the Services except as allowed by law;</li>
          <li>resell or sublicense access to the Services without our written consent;</li>
          <li>use the Services in a way that harms RealifyAI, its users, or third parties.</li>
        </ul>
        <p style={mutedText}>
          We may investigate violations and take any action we consider appropriate, including
          removing content, limiting access, suspending accounts, terminating accounts, or
          cooperating with law enforcement or rights holders.
        </p>

        <div style={sectionTitle}>7. Private and Public Content</div>
        <p style={mutedText}>
          Certain features may allow content to be marked private or displayed publicly. We will
          handle those settings according to the functionality of the Services, but you are
          responsible for choosing the correct settings and understanding that no system is perfectly
          secure.
        </p>

        <div style={sectionTitle}>8. Intellectual Property</div>
        <p style={mutedText}>
          The Services, including our software, design, branding, logos, text, graphics, interfaces,
          and related content, are owned by RealifyAI or our licensors and are protected by
          applicable intellectual property laws.
        </p>
        <p style={mutedText}>
          Subject to your compliance with these Terms, we grant you a limited, non-exclusive,
          non-transferable, revocable license to access and use the Services for your own lawful
          use.
        </p>
        <p style={mutedText}>
          You may not copy, modify, distribute, sell, sublicense, or exploit the Services except as
          expressly permitted by these Terms or by law.
        </p>

        <div style={sectionTitle}>9. Feedback</div>
        <p style={mutedText}>
          If you provide suggestions, ideas, or feedback about the Services, you grant us the right
          to use them without restriction or compensation to you.
        </p>

        <div style={sectionTitle}>10. Third-Party Services</div>
        <p style={mutedText}>
          The Services may rely on or integrate with third-party providers, including hosting,
          authentication, storage, payment processors, and AI/model providers.
        </p>
        <p style={mutedText}>
          We are not responsible for the acts, omissions, availability, or policies of third-party
          services.
        </p>

        <div style={sectionTitle}>11. Copyright Complaints</div>
        <p style={mutedText}>
          If you believe content available through the Services infringes your copyright, contact us
          at:
        </p>
        <p style={mutedText}>
          <strong>support@realifyapp.net</strong>
        </p>
        <p style={mutedText}>
          Your notice should include enough detail for us to identify the allegedly infringing
          material and evaluate the complaint.
        </p>

        <div style={sectionTitle}>12. Privacy</div>
        <p style={mutedText}>
          Our collection, use, and disclosure of personal information are described in our Privacy
          Policy, which is incorporated into these Terms by reference.
        </p>

        <div style={sectionTitle}>13. Disclaimer of Warranties</div>
        <p style={mutedText}>
          THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.”
        </p>
        <p style={mutedText}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, REALIFYAI DISCLAIMS ALL WARRANTIES, WHETHER
          EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING OUT
          OF COURSE OF DEALING OR USAGE OF TRADE.
        </p>
        <p style={mutedText}>WE DO NOT GUARANTEE THAT:</p>
        <ul style={mutedText}>
          <li>THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE;</li>
          <li>OUTPUTS WILL BE ACCURATE, LAWFUL, NON-INFRINGING, OR SUITABLE FOR YOUR INTENDED USE;</li>
          <li>DEFECTS WILL BE CORRECTED;</li>
          <li>THE SERVICES WILL ALWAYS BE AVAILABLE.</li>
        </ul>

        <div style={sectionTitle}>14. Limitation of Liability</div>
        <p style={mutedText}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, REALIFYAI AND ITS AFFILIATES, OFFICERS,
          EMPLOYEES, CONTRACTORS, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY
          LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR
          RELATING TO THE SERVICES OR THESE TERMS.
        </p>
        <p style={mutedText}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, REALIFYAI’S TOTAL LIABILITY FOR ANY CLAIM ARISING
          OUT OF OR RELATING TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF:
        </p>
        <ul style={mutedText}>
          <li>THE AMOUNT YOU PAID TO REALIFYAI IN THE 12 MONTHS BEFORE THE CLAIM AROSE; OR</li>
          <li>$100 USD.</li>
        </ul>
        <p style={mutedText}>
          Some jurisdictions do not allow certain limitations, so parts of this section may not
          apply to you.
        </p>

        <div style={sectionTitle}>15. Indemnification</div>
        <p style={mutedText}>
          To the maximum extent permitted by law, you agree to defend, indemnify, and hold harmless
          RealifyAI and its affiliates, officers, employees, contractors, licensors, and service
          providers from and against claims, damages, liabilities, losses, costs, and expenses,
          including reasonable attorneys’ fees, arising out of or related to:
        </p>
        <ul style={mutedText}>
          <li>your Inputs, Outputs, or use of the Services;</li>
          <li>your violation of these Terms;</li>
          <li>your infringement or violation of any rights of another person or entity.</li>
        </ul>

        <div style={sectionTitle}>16. Suspension and Termination</div>
        <p style={mutedText}>
          We may suspend or terminate your access to the Services at any time, with or without
          notice, if we believe you violated these Terms, created risk, failed to pay amounts due,
          or used the Services improperly.
        </p>
        <p style={mutedText}>You may stop using the Services at any time.</p>

        <div style={sectionTitle}>17. Changes to These Terms</div>
        <p style={mutedText}>
          We may update these Terms from time to time. If we make material changes, we may provide
          notice by updating the date above, posting notice in the Services, emailing users, or
          requiring renewed acceptance where appropriate.
        </p>
        <p style={mutedText}>
          Your continued use of the Services after updated Terms take effect constitutes acceptance
          of the updated Terms.
        </p>

        <div style={sectionTitle}>18. Governing Law</div>
        <p style={mutedText}>
          These Terms are governed by the laws of the State of Colorado, United States, without
          regard to conflict of law principles.
        </p>
        <p style={mutedText}>
          Any dispute arising out of or relating to these Terms or the Services will be resolved in
          the state or federal courts located in El Paso County, Colorado, and you consent to their
          jurisdiction and venue.
        </p>

        <div style={sectionTitle}>19. General</div>
        <p style={mutedText}>
          If any provision of these Terms is found unenforceable, the remaining provisions will
          remain in effect.
        </p>
        <p style={mutedText}>
          These Terms, together with our Privacy Policy and any other policies expressly incorporated
          by reference, constitute the entire agreement between you and RealifyAI regarding the
          Services.
        </p>

        <div style={sectionTitle}>20. Contact</div>
        <p style={mutedText}>
          <strong>Support:</strong> support@realifyapp.net
          <br />
          <strong>Affiliate inquiries:</strong> affiliates@realifyapp.net
        </p>
      </div>
    </main>
  );
}
