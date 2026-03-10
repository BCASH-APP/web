import './pages.css';
import { databases } from '../lib/appwrite';

export const DashboardPage = () => {
  // Later you can replace this placeholder with real Appwrite queries that match your mobile app.
  void databases;

  return (
    <div className="page-shell">
      <section className="page-card">
        <div className="release-meta" style={{ marginBottom: '0.75rem' }}>
          <span className="text-eyebrow">Owner dashboard</span>
          <span className="release-meta-dot" />
          <span>Private · Clerk protected</span>
        </div>
        <h1 className="text-heading">Your bakery overview</h1>
        <p className="text-subtitle" style={{ marginTop: '0.5rem' }}>
          This space is where we&apos;ll mirror the DashingBakery React Native data model: stores,
          organizations, sales, and more, powered by Appwrite.
        </p>

        <div style={{ marginTop: '1.5rem' }} className="page-grid">
          <div className="page-card">
            <p className="text-eyebrow">Today at a glance</p>
            <p className="stacked-list-body" style={{ marginTop: '0.45rem' }}>
              Replace this with live metrics from your Appwrite collections – totals, top‑selling
              items, or open orders.
            </p>
          </div>
          <div className="page-card page-card-muted">
            <p className="text-eyebrow">Next steps</p>
            <ul className="invite-steps">
              <li>Reuse your React Native types for stores, products, and orders.</li>
              <li>Call Appwrite databases/functions here using the shared client.</li>
              <li>Gradually copy useful views from the mobile app into the web dashboard.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

