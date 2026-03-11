import { Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import { Show, UserButton, SignInButton, SignUpButton } from '@clerk/react';
import { LayoutDashboard, Home, Download } from 'lucide-react';
import appIcon from './assets/appIcon/icon.png';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { InvitationPage } from './pages/auth/InvitationPage';
import { DashboardPage } from './pages/DashboardPage';
// import { ReleasesPage } from './pages/ReleasesPage';
import { DownloadPage } from './pages/DownloadPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { PolicyPage } from './pages/PolicyPage';
import './App.css';

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={`app-nav-link${active ? ' app-nav-link-active' : ''}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <Link to="/" className="app-logo-pill">
            <img src={appIcon} alt="BCash POS icon" className="app-logo-image" />
            <span className="app-logo-text-main">BCash</span>
            <span className="app-logo-text-sub">POS</span>
          </Link>
          <span className="app-dev-badge">by Basthdev</span>
        </div>

        <nav className="app-header-nav">
          <NavLink to="/" icon={<Home size={14} />} label="Home" />
          <NavLink to="/download" icon={<Download size={14} />} label="Download" />
          <Show when="signed-in">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={14} />} label="Dashboard" />
          </Show>
        </nav>

        <div className="app-header-right">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="app-btn-secondary" type="button">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="app-btn-primary" type="button">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/download" element={<DownloadPage />} />

          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/invitation" element={<InvitationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} <strong>Basthdev</strong> · BCash POS System</span>
        <nav className="app-footer-nav">
          <Link to="/privacy">Privacy</Link>
          <Link to="/policy">Terms</Link>
          <Link to="/download">Download</Link>
        </nav>
      </footer>
    </div>
  );
}

export default App;
