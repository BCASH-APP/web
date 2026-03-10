import { useEffect, useMemo, useState } from 'react';
import { OrganizationSwitcher, Show, useAuth, useOrganization } from '@clerk/react';
import { Query } from 'appwrite';
import './pages.css';
import { databases, databaseId, paymentsCollectionId } from '../lib/appwrite';

type PaymentDoc = {
  $id: string;
  $createdAt: string;
  orgId?: string;
  org_id?: string;
  paymentMethod?: string;
  payment_method?: string;
  amount?: number;
  total?: number;
  status?: string;
};

function normalizePaymentMethod(doc: PaymentDoc): string {
  return doc.paymentMethod ?? doc.payment_method ?? 'unknown';
}

function normalizeAmount(doc: PaymentDoc): number {
  const v = doc.amount ?? doc.total ?? 0;
  return typeof v === 'number' ? v : Number(v) || 0;
}

function normalizeOrgId(doc: PaymentDoc): string | undefined {
  return doc.orgId ?? doc.org_id;
}

export const DashboardPage = () => {
  const { isLoaded, userId } = useAuth();
  const { organization } = useOrganization();

  const activeOrgId = organization?.id;

  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canQueryPayments = Boolean(databaseId && paymentsCollectionId && isLoaded && userId);

  useEffect(() => {
    async function load() {
      if (!canQueryPayments) return;

      setLoading(true);
      setError(null);

      try {
        const queries: string[] = [];

        if (activeOrgId) {
          queries.push(Query.equal('orgId', activeOrgId));
        }
        if (status !== 'all') {
          queries.push(Query.equal('status', status));
        }
        if (paymentMethod !== 'all') {
          queries.push(Query.equal('paymentMethod', paymentMethod));
        }

        const res = await databases.listDocuments(databaseId, paymentsCollectionId, queries);
        setPayments(res.documents as unknown as PaymentDoc[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load payments');
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [activeOrgId, canQueryPayments, paymentMethod, status]);

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    for (const p of payments) set.add(normalizePaymentMethod(p));
    return ['all', ...Array.from(set).sort()];
  }, [payments]);

  const totalRevenue = useMemo(() => payments.reduce((sum, p) => sum + normalizeAmount(p), 0), [payments]);

  const visibleOrgId = activeOrgId ?? (payments[0] ? normalizeOrgId(payments[0]) : undefined);

  return (
    <div className="page-shell">
      <section className="page-card">
        <div className="release-meta" style={{ marginBottom: '0.75rem' }}>
          <span className="text-eyebrow">Owner dashboard</span>
          <span className="release-meta-dot" />
          <span>Organizations + Sales (Appwrite)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className="text-heading">Analytics overview</h1>
            <p className="text-subtitle" style={{ marginTop: '0.5rem' }}>
              Select a Clerk organization (orgId) and review sales/payment summaries loaded from Appwrite.
            </p>
          </div>
          <div style={{ minWidth: 260 }}>
            <Show when="signed-in">
              <OrganizationSwitcher
                hidePersonal
                appearance={{
                  elements: {
                    rootBox: { width: '100%' },
                  },
                }}
              />
            </Show>
          </div>
        </div>

        <div style={{ marginTop: '1.2rem' }} className="page-grid">
          <div className="page-card">
            <p className="text-eyebrow">Active organization</p>
            <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
              {organization?.name ?? 'No organization selected'}
            </p>
            <p className="stacked-list-meta">{visibleOrgId ? `orgId: ${visibleOrgId}` : 'orgId: —'}</p>

            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
              <div className="page-card page-card-muted">
                <p className="text-eyebrow">Payments</p>
                <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
                  {loading ? 'Loading…' : `${payments.length}`}
                </p>
                <p className="stacked-list-meta">Filtered by org/payment/status</p>
              </div>
              <div className="page-card page-card-muted">
                <p className="text-eyebrow">Revenue (sum)</p>
                <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
                  {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="stacked-list-meta">Based on `amount` / `total` field</p>
              </div>
            </div>
          </div>

          <div className="page-card">
            <p className="text-eyebrow">Filters</p>

            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
              <label className="stacked-list-body">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ display: 'block', marginTop: 6, width: '100%', padding: '0.5rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </label>

              <label className="stacked-list-body">
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ display: 'block', marginTop: 6, width: '100%', padding: '0.5rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              {!databaseId || !paymentsCollectionId ? (
                <p className="muted-text">
                  Missing Appwrite env vars. Set <code>VITE_APPWRITE_DB_ID</code> and <code>VITE_APPWRITE_PAYMENTS_COLLECTION_ID</code>.
                </p>
              ) : null}

              {error ? <p className="muted-text">Error: {error}</p> : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }} className="page-card page-card-muted">
          <p className="text-eyebrow">Payments</p>
          <p className="muted-text" style={{ marginTop: '0.35rem' }}>
            This list comes from Appwrite. Ensure your payment docs store the Clerk org id in a field like <code>orgId</code>.
          </p>

          <ul className="stacked-list" style={{ marginTop: '1rem' }}>
            {payments.slice(0, 10).map((p) => (
              <li key={p.$id}>
                <p className="stacked-list-title">
                  {normalizePaymentMethod(p)} · {normalizeAmount(p).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="stacked-list-body">
                  status: {p.status ?? '—'} · org: {normalizeOrgId(p) ?? '—'}
                </p>
                <p className="stacked-list-meta">created: {p.$createdAt}</p>
              </li>
            ))}
            {!loading && payments.length === 0 ? (
              <li>
                <p className="stacked-list-body">No payments found for the current filters.</p>
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
};

