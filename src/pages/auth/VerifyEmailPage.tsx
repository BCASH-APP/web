import '../pages.css';

export const VerifyEmailPage = () => {
  return (
    <div className="page-shell">
      <section className="page-card" style={{ maxWidth: 520, marginInline: 'auto' }}>
        <p className="text-eyebrow">Verify your email</p>
        <p className="text-subtitle" style={{ marginTop: '0.35rem' }}>
          This route is reserved for Store&apos;s email verification links. In Store, point your
          verification URL here, or to a dedicated verification component, so users land in the
          Store experience.
        </p>
        <p className="stacked-list-body" style={{ marginTop: '0.9rem' }}>
          Once verification is complete, you can redirect users to their original destination (for
          example, the dashboard or an invite acceptance page).
        </p>
      </section>
    </div>
  );
};

