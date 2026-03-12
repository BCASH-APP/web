import { useState } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Star,
  CheckCircle2,
  Github,
  AlertTriangle,
} from 'lucide-react';
import './pages.css';

// ── Update this URL when you publish a new GitHub Release ──────────────────
const APK_GITHUB_URL =
  'https://github.com/BCASH-APP/web/releases/latest/download/BCashPOS.apk';

// const APK_GITHUB_URL_DEBUG =
//   'https://github.com/BCASH-APP/web/releases/latest/download/app-debug.apk';
const FEATURES = [
  { icon: <Zap size={18} />, text: 'Point of Sale — fast, offline-capable cashier' },
  { icon: <Star size={18} />, text: 'Sales analytics — daily, weekly, monthly reports' },
  { icon: <ShieldCheck size={18} />, text: 'Role-based access — owner, admin, cashier' },
  { icon: <CheckCircle2 size={18} />, text: 'Ingredient tracking — auto stock deduction on sale' },
];

const STEPS = [
  'Tap the "Download APK" button below.',
  'Open the downloaded file from your notification bar.',
  'If prompted, allow "Install from unknown sources" in Android settings.',
  'Install and sign in with your BCash account.',
];

export const DownloadPage = () => {
  const [clicked, setClicked] = useState(false);

  const handleDownload = () => {
    setClicked(true);
    window.open(APK_GITHUB_URL, '_blank', 'noopener,noreferrer');
  };

  // const handleDownloadDebug = () => {
  //   setClicked(true);
  //   window.open(APK_GITHUB_URL_DEBUG, '_blank', 'noopener,noreferrer');
  // };

  return (
    <div className="page-shell download-page">
      {/* Hero */}
      <div className="dl-hero">
        <div className="dl-hero-badge">
          <Smartphone size={14} />
          Android App — BCash POS System
        </div>
        <h1 className="text-heading">Download BCash POS</h1>
        <p className="text-subtitle">
          The all-in-one store management app by <strong>Basthdev</strong>. Free to download, sign
          in with your existing account.
        </p>

        <div className="dl-hero-actions">
          <button className="dl-btn-main" onClick={handleDownload} type="button">
            <Download size={20} />
            <span>Download APK</span>
          </button>
          {/* <button className="dl-btn-main" onClick={handleDownloadDebug} type="button">
            <Download size={20} />
            <span>Download APK Debug</span>
          </button> */}
        </div>
        <p className="dl-btn-hint">
          {clicked ? (
            <span className="dl-downloading">
              <CheckCircle2 size={13} /> Download started — check your notifications
            </span>
          ) : (
            'Android only · Latest release from GitHub'
          )}
        </p>
      </div>

      {/* Two-col */}
      <div className="dl-two-col">
        {/* Left: What's included */}
        <div className="dl-card">
          <h2 className="dl-card-title">
            <Star size={16} /> What's included
          </h2>
          <ul className="dl-feature-list">
            {FEATURES.map((f, i) => (
              <li key={i} className="dl-feature-row">
                <span className="dl-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Install steps */}
        <div className="dl-card">
          <h2 className="dl-card-title">
            <CheckCircle2 size={16} /> How to install
          </h2>
          <ol className="dl-steps">
            {STEPS.map((step, i) => (
              <li key={i} className="dl-step">
                <span className="dl-step-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Security notice */}
      <div className="dl-notice">
        <AlertTriangle size={16} className="dl-notice-icon" />
        <p>
          <strong>Security notice:</strong> This APK is distributed directly from our{' '}
          <a
            href="https://github.com/basthdev/bcash-pos/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="dl-link"
          >
            GitHub Releases <Github size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </a>
          . You can inspect the source code and release assets there. Always install from trusted
          sources.
        </p>
      </div>

      {/* Alt CTA */}
      <div className="dl-alt">
        <a
          href="https://github.com/basthdev/bcash-pos/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="dl-btn-outline"
        >
          <Github size={16} />
          <span>View all releases on GitHub</span>
        </a>
      </div>
    </div>
  );
};
