import { Route, Routes, Navigate } from 'react-router-dom';
import { Show, UserButton, SignInButton, SignUpButton } from '@clerk/react';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { InvitationPage } from './pages/auth/InvitationPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReleasesPage } from './pages/ReleasesPage';
import './App.css';

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo-pill">
            <span className="app-logo-dot" />
            <span className="app-logo-text-main">DashingBakery</span>
            <span className="app-logo-text-sub">Web</span>
          </div>
        </div>
        <nav className="app-header-nav">
          <a href="/" className="app-nav-link">
            Home
          </a>
          <a href="/releases" className="app-nav-link">
            Releases
          </a>
          <Show when="signed-in">
            <a href="/dashboard" className="app-nav-link">
              Dashboard
            </a>
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
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/invitation" element={<InvitationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
