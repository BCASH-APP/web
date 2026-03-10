import { Link } from 'react-router-dom';
import './pages.css';

// Exact copy from DashingBakery locales/en.json "terms" (same as app/auth/terms.tsx)
const content = {
  headerTitle: 'Terms of Service',
  lastUpdated: 'Last Updated: March 2026',
  intro:
    'These Terms of Service ("Terms") govern your use of the BCash mobile application. By creating an account or using our point-of-sale services, you agree to be bound by these Terms.',
  s1Title: '1. Account Registrations',
  s1P:
    'To use BCash, you must register for an account using your email or Google Account. You are responsible for safeguarding your login credentials. You agree that any information you provide during registration is accurate and up-to-date.',
  s2Title: '2. Service Tiers and Subscriptions',
  s2PIntro: 'BCash offers both Basic and Premium plan tiers.\n\n',
  s2BasicBold: 'Basic Plan:',
  s2Basic: ' Includes standard POS features with limited stores.\n',
  s2PremBold: 'Premium Plan:',
  s2Prem:
    ' Grants access to analytics, multi-store management, and bulk discount pricing models (e.g., 6-month and 1-year duration discounts).\n\nAll subscription fees are non-refundable unless stated otherwise by applicable law.',
  s3Title: '3. User Conduct & Store Management',
  s3P:
    'By creating a store, you take full administrative responsibility for the data entered, including product pricing, stock tracking, and user invitations. You agree not to use the application for any illegal or unauthorized purpose.',
  s4Title: '4. Intellectual Property',
  s4P:
    "The app's design, features, software, graphics, and source code are owned by BCash and protected by copyright laws. You may not copy, modify, distribute, or reverse-engineer any part of the service.",
  s5Title: '5. Termination',
  s5P:
    'We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may terminate your account at any time by navigating to your settings and requesting deletion.',
  s6Title: '6. Limitations of Liability',
  s6P:
    'BCash is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the application, including data loss or loss of profits.',
};

export const PolicyPage = () => {
  return (
    <div className="page-shell">
      <section className="page-card legal-page" style={{ maxWidth: 720, marginInline: 'auto' }}>
        <div className="legal-header">
          <Link to="/" className="legal-back">
            ← Back
          </Link>
          <h1 className="text-heading legal-title">{content.headerTitle}</h1>
          <span style={{ width: 60 }} />
        </div>

        <div className="legal-icon-wrap">📖</div>
        <p className="legal-last-updated">{content.lastUpdated}</p>

        <p className="legal-paragraph">{content.intro}</p>

        <h2 className="legal-section-title">{content.s1Title}</h2>
        <p className="legal-paragraph">{content.s1P}</p>

        <h2 className="legal-section-title">{content.s2Title}</h2>
        <p className="legal-paragraph">
          {content.s2PIntro}
          <strong>{content.s2BasicBold}</strong>
          {content.s2Basic}
          <strong>{content.s2PremBold}</strong>
          {content.s2Prem}
        </p>

        <h2 className="legal-section-title">{content.s3Title}</h2>
        <p className="legal-paragraph">{content.s3P}</p>

        <h2 className="legal-section-title">{content.s4Title}</h2>
        <p className="legal-paragraph">{content.s4P}</p>

        <h2 className="legal-section-title">{content.s5Title}</h2>
        <p className="legal-paragraph">{content.s5P}</p>

        <h2 className="legal-section-title">{content.s6Title}</h2>
        <p className="legal-paragraph">{content.s6P}</p>
      </section>
    </div>
  );
};
