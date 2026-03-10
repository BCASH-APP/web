import { Link } from 'react-router-dom';
import './pages.css';

// Exact copy from DashingBakery locales/en.json "privacy" (same as app/auth/privacy.tsx)
const content = {
  headerTitle: 'Privacy Policy',
  lastUpdated: 'Last Updated: March 2026',
  intro:
    'Welcome to BCash ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us.',
  s1Title: '1. Information We Collect',
  s1P1Bold: 'Personal Information You Provide:',
  s1P1:
    ' We collect information you voluntarily provide to us when you register on our application, such as your full name, email address, password, and profile picture (if authenticated via Google).',
  s1P2Bold: 'Business Information:',
  s1P2:
    ' When you set up a store in the BCash App, we collect data related to your business (e.g., store name, staff members, product inventory, and transaction history).',
  s2Title: '2. How We Use Your Information',
  s2P:
    'We use the information we collect or receive to: \n• Facilitate account creation and authentication (via Clerk & Google).\n• Provide point-of-sale (POS) services, inventory management, and transaction analytics.\n• Manage user accounts and multi-store staff access.\n• Process premium subscriptions and maintain billing records.\n• Send administrative information, such as updates, alerts, and invitations.',
  s3Title: '3. Will Your Info Be Shared With Anyone?',
  s3P:
    "We only share information with third-party vendors and service providers that perform services for us or on our behalf. These include:\n• ",
  s3ClerkBold: 'Clerk:',
  s3Clerk: ' Used for user authentication and identity management.\n• ',
  s3PayBold: 'Payment Processors:',
  s3Pay: ' Used to handle subscription payments securely.\n• ',
  s3CloudBold: 'Cloud Infrastructure Providers:',
  s3Cloud: " To securely host your store's data.",
  s4Title: '4. Data Security and Retention',
  s4P:
    'We aim to protect your personal information through a system of organizational and technical security measures. Your account data is secured using industry-standard encryption protocols. We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.',
  s5Title: '5. Your Privacy Rights',
  s5P:
    'You may review, change, or terminate your account at any time. If you wish to delete your account or clear all application data, you can do so through the Settings menu inside the BCash application.',
};

export const PrivacyPage = () => {
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

        <div className="legal-icon-wrap">🛡️</div>
        <p className="legal-last-updated">{content.lastUpdated}</p>

        <p className="legal-paragraph">{content.intro}</p>

        <h2 className="legal-section-title">{content.s1Title}</h2>
        <p className="legal-paragraph">
          <strong>{content.s1P1Bold}</strong>
          {content.s1P1}
          <br />
          <br />
          <strong>{content.s1P2Bold}</strong>
          {content.s1P2}
        </p>

        <h2 className="legal-section-title">{content.s2Title}</h2>
        <p className="legal-paragraph" style={{ whiteSpace: 'pre-line' }}>
          {content.s2P}
        </p>

        <h2 className="legal-section-title">{content.s3Title}</h2>
        <p className="legal-paragraph">
          {content.s3P}
          <strong>{content.s3ClerkBold}</strong>
          {content.s3Clerk}
          <strong>{content.s3PayBold}</strong>
          {content.s3Pay}
          <strong>{content.s3CloudBold}</strong>
          {content.s3Cloud}
        </p>

        <h2 className="legal-section-title">{content.s4Title}</h2>
        <p className="legal-paragraph">{content.s4P}</p>

        <h2 className="legal-section-title">{content.s5Title}</h2>
        <p className="legal-paragraph">{content.s5P}</p>
      </section>
    </div>
  );
};
