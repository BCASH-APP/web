import { SignIn } from '@clerk/react';
import '../pages.css';

export const SignInPage = () => {
  return (
    <div className="page-shell">
      <section className="page-card" style={{ maxWidth: 480, marginInline: 'auto' }}>
        <p className="text-eyebrow">Sign in</p>
        <p className="text-subtitle" style={{ marginTop: '0.35rem' }}>
          Use the same Clerk account as your DashingBakery mobile app. After signing in from an
          invite link, we can deep‑link you back into the app.
        </p>
        <div style={{ marginTop: '1.2rem' }}>
          <SignIn routing="path" path="/auth/sign-in" />
        </div>
      </section>
    </div>
  );
};

