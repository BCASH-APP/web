import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Show, SignIn } from '@clerk/react';
import '../pages.css';

const APP_SCHEME_URL = 'dashingbakery://';
const APP_FALLBACK_URL = 'https://basthdev.my.id/bcash-download'; // replace with real landing/store URL

export const InvitationPage = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteToken = params.get('inviteToken') ?? params.get('invitation');

    if (!inviteToken) {
      return;
    }

    const deepLink = `${APP_SCHEME_URL}invite?token=${encodeURIComponent(inviteToken)}`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    const timeout = window.setTimeout(() => {
      window.location.href = APP_FALLBACK_URL;
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
      document.body.removeChild(iframe);
    };
  }, [location.search]);

  return (
    <div className="page-shell">
      <section className="page-card" style={{ maxWidth: 540, marginInline: 'auto' }}>
        <div className="tag-pill tag-soft">Invitation</div>
        <h1 className="text-heading" style={{ marginTop: '0.8rem' }}>
          Accepting your DashingBakery invite
        </h1>
        <p className="text-subtitle" style={{ marginTop: '0.55rem' }}>
          If the mobile app is installed, it will open automatically with this invitation. Otherwise
          we&apos;ll send you to a page where you can install the app.
        </p>

        <ol className="invite-steps" style={{ marginTop: '0.9rem' }}>
          <li>You clicked an invite email or link that brought you here.</li>
          <li>Clerk verifies your identity (sign in or sign up if needed).</li>
          <li>We attempt to open the app using the custom URL scheme.</li>
          <li>If that fails, you&apos;re redirected to the download or help page.</li>
        </ol>

        <p className="muted-text" style={{ marginTop: '1.2rem' }}>
          You can tune the timing, parameters, and destination URL to exactly match your React
          Native implementation.
        </p>

        <div style={{ marginTop: '1.4rem' }}>
          <Show when="signed-out">
            <p className="text-eyebrow" style={{ marginBottom: '0.4rem' }}>
              Sign in to accept
            </p>
            <SignIn routing="path" path="/auth/invitation" />
          </Show>
        </div>
      </section>
    </div>
  );
};

