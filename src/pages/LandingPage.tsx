import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  BarChart2,
  ClipboardList,
  Package,
  Users,
  Globe,
  Download,
  Shield,
  GitBranch,
} from 'lucide-react';
import './pages.css';
import appIconPng from '../assets/appIcon/icon.png';
import splashIcon from '../assets/appIcon/splash-icon.png';
import adaptiveIcon from '../assets/appIcon/adaptive-icon.png';

const FEATURES = [
  {
    icon: <ShoppingCart size={20} />,
    title: 'Point of Sale (POS)',
    desc: 'Seamless cashier experience with cart, payment methods, and instant receipts.',
  },
  {
    icon: <BarChart2 size={20} />,
    title: 'Sales Analytics',
    desc: 'Daily, weekly, and monthly reports. Revenue trends, peak hours, and top products at a glance.',
  },
  {
    icon: <ClipboardList size={20} />,
    title: 'Transaction History',
    desc: 'Full transaction logs with search, filters, and detailed breakdowns per sale.',
  },
  {
    icon: <Package size={20} />,
    title: 'Ingredient & Stock',
    desc: 'Track ingredient usage automatically on every sale. Restock alerts when stock runs low.',
  },
  {
    icon: <Users size={20} />,
    title: 'Staff Management',
    desc: 'Invite staff via email. Role-based access for owners, admins, and cashiers.',
  },
  {
    icon: <Globe size={20} />,
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
              <img src={adaptiveIcon} alt="BCash POS adaptive icon" className="landing-phone-img" />
            </div>
            <div className="landing-phone landing-phone-front">
              <img src={splashIcon} alt="BCash POS splash" className="landing-phone-img landing-phone-img-cover" />
            </div>
          </div>

          <div className="landing-app-badge">
            <img src={appIconPng} alt="BCash POS icon" className="landing-badge-icon" />
            <div className="landing-badge-text">
              <span className="landing-badge-name">BCash POS System</span>
              <span className="landing-badge-sub">by Basthdev</span>
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
          <div className="landing-eyebrow-pill">
            <ShoppingCart size={11} /> Bakery Management System
          </div>

          <h1 className="landing-title">
            BCash POS System
            <span className="landing-title-accent"> — Run your bakery smarter.</span>
          </h1>

          <p className="landing-subtitle">
            An all‑in‑one mobile &amp; web platform by <strong>Basthdev</strong> for bakery owners.
            Manage sales, track ingredients, analyze performance, and empower your team — from a
            single app.
          </p>

          <div className="landing-cta-row">
            <Link to="/download" className="app-btn-primary landing-cta-main">
              <Download size={15} /> Download App
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
            <Link to="/releases" className="landing-legal-link">
              <GitBranch size={12} /> Release Notes
            </Link>
            <Link to="/privacy" className="landing-legal-link">
              <Shield size={12} /> Privacy Policy
            </Link>
            <Link to="/policy" className="landing-legal-link">
              <ClipboardList size={12} /> Terms of Service
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <img src={appIconPng} alt="BCash POS" className="landing-footer-icon" />
            <span className="landing-footer-name">BCash POS System · Basthdev</span>
          </div>
          <nav className="landing-footer-nav">
            <Link to="/" className="landing-footer-link">Home</Link>
            <Link to="/download" className="landing-footer-link">Download</Link>
            <Link to="/releases" className="landing-footer-link">Releases</Link>
            <Link to="/privacy" className="landing-footer-link">Privacy</Link>
            <Link to="/policy" className="landing-footer-link">Terms</Link>
            <Link to="/dashboard" className="landing-footer-link">Dashboard</Link>
          </nav>
          <p className="landing-footer-copy">© {new Date().getFullYear()} Basthdev. Built with ❤️ using Expo &amp; Appwrite.</p>
        </div>
      </footer>
    </div>
  );
};
