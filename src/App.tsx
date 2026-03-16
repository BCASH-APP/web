import { Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import { UserButton, SignInButton, SignUpButton, useUser } from '@clerk/react';
import { LayoutDashboard, Home, Download, Menu, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import appIcon from './assets/appIcon/icon.png';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { InvitationPage } from './pages/auth/InvitationPage';
import { DashboardPage } from './pages/DashboardPage';
import { SecretAdminPage } from './pages/SecretAdminPage';
// import { ReleasesPage } from './pages/ReleasesPage';
import { DownloadPage } from './pages/DownloadPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { PolicyPage } from './pages/PolicyPage';
import './App.css';
import './pages/dashboard-pro.css';

function NavLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={`app-nav-link${active ? ' app-nav-link-active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function App() {
  const { isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className={`app-root ${mobileMenuOpen ? 'menu-open' : ''} ${isDashboard ? 'is-dashboard-layout' : ''}`}>
      {!isDashboard && (
        <header className="pro-topbar" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--pro-border)' }}>
          <div className="pro-topbar-left">
            <Link to="/" className="pro-sidebar-logo" style={{ border: 'none', padding: 0, height: 'auto', textDecoration: 'none' }}>
              <img src={appIcon || "./assets/appIcon/favicon.png"} alt="Bcash" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <span style={{ fontSize: 18, color: 'var(--pro-text-main)' }}>BCash POS</span>
            </Link>
          </div>

          <nav className="pro-topbar-left" style={{ flex: 1, justifyContent: 'center' }}>
            {!isSignedIn && (
              <NavLink to="/" icon={<Home size={16} />} label="Home" />
            )}
            <NavLink to="/download" icon={<Download size={16} />} label="Download" />
            {isSignedIn && (
              <NavLink to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
            )}
          </nav>

          <div className="pro-topbar-right">
            {!isSignedIn && (
              <div className="auth-btns-desktop" style={{ display: 'flex', gap: '12px' }}>
                <SignInButton mode="modal">
                  <button className="pro-hero-btn" style={{ background: '#f1f5f9', color: '#0f172a' }} type="button">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="pro-btn-primary" type="button">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            )}
            {isSignedIn && (
              <div className="pro-user-profile" style={{ gap: '16px' }}>
                <span className="pro-user-name hide-mobile">Manage Account</span>
                <UserButton />
              </div>
            )}

            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--pro-text-main)' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>
      )}

      {/* Mobile Drawer */}
      {!isDashboard && (
        <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="mobile-nav">
            {!isSignedIn && (
              <NavLink to="/" icon={<Home size={18} />} label="Home" />
            )}
            <NavLink to="/download" icon={<Download size={18} />} label="Download" />
            {isSignedIn && (
              <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            )}

            {!isSignedIn && (
              <div className="mobile-auth-section">
                <SignInButton mode="modal">
                  <button className="app-btn-secondary mobile-btn" type="button">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="app-btn-primary mobile-btn" type="button">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            )}
          </nav>
        </div>
      )}

      <main className={`${isDashboard ? 'dashboard-mode' : ''}`}>
        <Routes>
          <Route path="/" element={isSignedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/download" element={<DownloadPage />} />

          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/invitation" element={<InvitationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/system-admin-panel" element={<SecretAdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isDashboard && (
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} <strong>Basthdev</strong> · BCash POS System</span>
          <nav className="app-footer-nav">
            <Link to="/privacy">Privacy</Link>
            <Link to="/policy">Terms</Link>
            <Link to="/download">Download</Link>
          </nav>
        </footer>
      )}
    </div>
  );
}

export default App;
