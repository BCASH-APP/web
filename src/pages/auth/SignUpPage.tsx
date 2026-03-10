import { SignUp } from '@clerk/react';
import '../pages.css';

export const SignUpPage = () => {
  return (
    <div className="page-shell">
      <section className="page-card" style={{ maxWidth: 480, marginInline: 'auto' }}>
        <p className="text-eyebrow">Create your bakery account</p>
        <p className="text-subtitle" style={{ marginTop: '0.35rem' }}>
          Create a DashingBakery owner account using Clerk. You can then create store locations and
          invite staff from the dashboard.
        </p>
        <div style={{ marginTop: '1.2rem' }}>
          <SignUp routing="path" path="/auth/sign-up" />
        </div>
      </section>
    </div>
  );
};

