import { Link } from 'react-router-dom';
import './pages.css';
import appIconPng from '../assets/appIcon/icon.png';
import splashIcon from '../assets/appIcon/splash-icon.png';
import adaptiveIcon from '../assets/appIcon/adaptive-icon.png';

const FEATURES = [
  {
    icon: '🛒',
    title: 'Point of Sale (POS)',
    desc: 'Seamless cashier experience with cart, payment methods, and instant receipts.',
  },
  {
    icon: '📊',
    title: 'Sales Analytics',
    desc: 'Daily, weekly, and monthly reports. Revenue trends, peak hours, and top products at a glance.',
  },
  {
    icon: '🧾',
    title: 'Transaction History',
    desc: 'Full transaction logs with search, filters, and detailed breakdowns per sale.',
  },
  {
    icon: '🧂',
    title: 'Ingredient & Stock',
    desc: 'Track ingredient usage automatically on every sale. Restock alerts when stock runs low.',
  },
  {
    icon: '👥',
    title: 'Staff Management',
    desc: 'Invite staff via email. Role-based access for owners, admins, and cashiers.',
  },
  {
    icon: '🌐',
    title: 'Web Dashboard',
    desc: 'Access your bakery data from any browser. Full analytics, reports, and team management.',
  },
];

export const LandingPage = () => {
  return (
    <div className="landing-root">

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="landing-hero">
        {/* Left panel – app visuals */}
        <div className="landing-left">
          <div className="landing-phone-stack">
            <div className="landing-phone landing-phone-back">
              <img src={adaptiveIcon} alt="DashingBakery adaptive icon" className="landing-phone-img" />
            </div>
            <div className="landing-phone landing-phone-front">
              <img src={splashIcon} alt="DashingBakery splash" className="landing-phone-img landing-phone-img-cover" />
            </div>
          </div>

          <div className="landing-app-badge">
            <img src={appIconPng} alt="DashingBakery icon" className="landing-badge-icon" />
            <div className="landing-badge-text">
              <span className="landing-badge-name">DashingBakery</span>
              <span className="landing-badge-sub">by BCash</span>
            </div>
          </div>

          <div className="landing-stat-chips">
            <div className="landing-stat-chip">
              <span className="landing-stat-num">POS</span>
              <span className="landing-stat-label">Integrated</span>
            </div>
            <div className="landing-stat-chip">
              <span className="landing-stat-num">∞</span>
              <span className="landing-stat-label">Transactions</span>
            </div>
            <div className="landing-stat-chip">
              <span className="landing-stat-num">Real‑time</span>
              <span className="landing-stat-label">Analytics</span>
            </div>
          </div>
        </div>

        {/* Right panel – app name + features */}
        <div className="landing-right">
          <div className="landing-eyebrow-pill">🥐 Bakery Management App</div>

          <h1 className="landing-title">
            DashingBakery
            <span className="landing-title-accent"> — Run your bakery smarter.</span>
          </h1>

          <p className="landing-subtitle">
            An all‑in‑one mobile &amp; web platform for bakery owners. Manage sales, track
            ingredients, analyze performance, and empower your team — from a single app.
          </p>

          <div className="landing-cta-row">
            <Link to="/auth/sign-up" className="app-btn-primary landing-cta-main">
              Get started free
            </Link>
            <Link to="/auth/sign-in" className="app-btn-secondary">
              Sign in
            </Link>
          </div>

          {/* Feature grid */}
          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <span className="landing-feature-icon">{f.icon}</span>
                <div>
                  <p className="landing-feature-title">{f.title}</p>
                  <p className="landing-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="landing-legal-links">
            <Link to="/releases" className="landing-legal-link">📋 Release Notes</Link>
            <Link to="/privacy" className="landing-legal-link">🔒 Privacy Policy</Link>
            <Link to="/policy" className="landing-legal-link">📄 Terms of Service</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <img src={appIconPng} alt="DashingBakery" className="landing-footer-icon" />
            <span className="landing-footer-name">DashingBakery · BCash</span>
          </div>
          <nav className="landing-footer-nav">
            <Link to="/" className="landing-footer-link">Home</Link>
            <Link to="/releases" className="landing-footer-link">Releases</Link>
            <Link to="/privacy" className="landing-footer-link">Privacy</Link>
            <Link to="/policy" className="landing-footer-link">Terms</Link>
            <Link to="/dashboard" className="landing-footer-link">Dashboard</Link>
          </nav>
          <p className="landing-footer-copy">© {new Date().getFullYear()} DashingBakery. Built with ❤️ using Expo &amp; Appwrite.</p>
        </div>
      </footer>
    </div>
  );
};
