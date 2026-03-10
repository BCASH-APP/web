import { Link } from 'react-router-dom';
import './pages.css';

export const LandingPage = () => {
  return (
    <div className="page-shell">
      <div className="page-grid">
        <section className="page-card">
          <div className="tag-pill tag-soft">Bakery teams · Mobile & web</div>
          <h1 className="text-heading" style={{ marginTop: '0.75rem' }}>
            Your bakery hub for sign‑ins, invites, and releases.
          </h1>
          <p className="text-subtitle" style={{ marginTop: '0.75rem' }}>
            BCash Web connects your team, guests, and store owners with the same identity and
            data model as the React Native app, powered by Clerk and Appwrite.
          </p>

          <div style={{ marginTop: '1.3rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/auth/sign-up" className="app-btn-primary">
              Get started – create bakery
            </Link>
            <Link to="/releases" className="app-btn-secondary">
              View latest releases
            </Link>
          </div>

          <div style={{ marginTop: '1.6rem', display: 'grid', gap: '0.9rem' }}>
            <div>
              <p className="text-eyebrow">Owners & admins</p>
              <p className="stacked-list-body" style={{ marginTop: '0.25rem' }}>
                Use the web dashboard to inspect sales, manage locations, invite staff, and check
                live status — all backed by Appwrite.
              </p>
            </div>
            <div>
              <p className="text-eyebrow">Staff & guests</p>
              <p className="stacked-list-body" style={{ marginTop: '0.25rem' }}>
                Accept invitations from your phone or laptop, then jump straight into the mobile app
                via a secure deep link.
              </p>
            </div>
            <div> 
              <Link to="/privacy" className="app-btn-secondary">
                Privacy Policy
              </Link>
              <Link to="/policy" className="app-btn-secondary">
                Terms of Service
              </Link>
            </div>
          </div>
        </section>

        <aside className="page-card page-card-muted">
          <p className="text-eyebrow">Web + App flow</p>
          <p className="stacked-list-body" style={{ marginTop: '0.35rem' }}>
            This site is the public entry point for your bakery organization. Clerk handles
            authentication, while Appwrite stores your bakeries, orders, and reports.
          </p>
          <ul className="invite-steps">
            <li>Customers and staff follow links sent from BCash.</li>
            <li>Clerk verifies their identity (email or social providers).</li>
            <li>
              The web app deep‑links into the mobile app using the{' '}
              <code>dashingbakery://</code> scheme.
            </li>
            <li>If the app isn&apos;t installed, we fall back to a download or help page.</li>
          </ul>

          <p className="muted-text" style={{ marginTop: '0.9rem' }}>
            You can customize this copy and link it from your store website or Play Store / App
            Store listing.
          </p>
        </aside>
      </div>
    </div>
  );
};

