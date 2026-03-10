import './pages.css';

export const ReleasesPage = () => {
  return (
    <div className="page-shell">
      <section className="page-card">
        <div className="release-meta" style={{ marginBottom: '0.8rem' }}>
          <span className="text-eyebrow">Releases & announcements</span>
          <span className="release-meta-dot" />
          <span>Mobile + web</span>
        </div>
        <h1 className="text-heading">What&apos;s new in DashingBakery</h1>
        <p className="text-subtitle" style={{ marginTop: '0.5rem' }}>
          This page is intended to mirror your in‑app changelog and release notes. Later you can
          source it from Appwrite documents shared with the mobile app.
        </p>

        <ul className="stacked-list" style={{ marginTop: '1.4rem' }}>
          <li>
            <p className="stacked-list-title">v1.0.0 – First public release</p>
            <p className="stacked-list-body">
              Initial launch of the DashingBakery mobile app and owner web portal. Manage stores,
              invite staff, and review sales.
            </p>
            <p className="stacked-list-meta">Released March 2026 · Stable channel</p>
          </li>
          <li>
            <p className="stacked-list-title">Upcoming</p>
            <p className="stacked-list-body">
              Deep integration with your analytics and additional store performance dashboards.
            </p>
            <p className="stacked-list-meta">Planned · Subject to change</p>
          </li>
        </ul>

        <p className="muted-text" style={{ marginTop: '1.4rem' }}>
          Hook this up to Appwrite by querying a &quot;releases&quot; collection, and reuse the same
          data in your React Native app.
        </p>
      </section>
    </div>
  );
};

