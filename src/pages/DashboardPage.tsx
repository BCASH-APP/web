import { useEffect, useMemo, useState } from 'react';
import { OrganizationSwitcher, Show, useAuth, useOrganization } from '@clerk/react';
import { Query } from 'appwrite';
import './pages.css';
import { saleItemsCollectionId, salesCollectionId } from '../lib/appwrite';
import { list, tenantQueries } from '../lib/repo';

type SaleHeaderDoc = {
  $id: string;
  $createdAt: string;
  timestamp?: string;
  paymentMethod?: string;
  total?: number;
  status?: string;
  orgId?: string | null;
  clerkUserId?: string;
};

type SaleItemDoc = {
  $id: string;
  $createdAt: string;
  timestamp?: string;
  saleId: string;
  quantity: number;
  priceEach?: number;
  hppSnapshotEach?: number;
  // some schemas store these names (mobile mapSaleItem)
  price?: number;
  cost?: number;
  orgId?: string | null;
  clerkUserId?: string;
};

function tsOf(doc: { timestamp?: string; $createdAt: string }) {
  return new Date(doc.timestamp || doc.$createdAt).getTime();
}

function pmOf(h: SaleHeaderDoc): string {
  return String(h.paymentMethod || 'cash').toLowerCase();
}

function totalOf(h: SaleHeaderDoc): number {
  return Number(h.total || 0);
}

function itemCost(it: SaleItemDoc): number {
  const costEach = Number(it.hppSnapshotEach ?? it.cost ?? 0);
  const qty = Number(it.quantity || 0);
  return costEach * qty;
}

export const DashboardPage = () => {
  const { isLoaded, userId } = useAuth();
  const { organization } = useOrganization();

  const activeOrgId = organization?.id;

  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [rangeStart, setRangeStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [rangeEnd, setRangeEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [saleHeaders, setSaleHeaders] = useState<SaleHeaderDoc[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItemDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canQuery = Boolean(isLoaded && userId);

  useEffect(() => {
    async function load() {
      if (!canQuery) return;

      setLoading(true);
      setError(null);

      try {
        const startTs = new Date(`${rangeStart}T00:00:00.000Z`).getTime();
        const endTs = new Date(`${rangeEnd}T23:59:59.999Z`).getTime();

        const tenant = tenantQueries(userId!, activeOrgId);

        // DashingBakery listByDateRange(): timestamp range + tenant scoping
        const headers = await list<SaleHeaderDoc>(salesCollectionId, [
          Query.greaterThanEqual('timestamp', new Date(startTs).toISOString()),
          Query.lessThanEqual('timestamp', new Date(endTs).toISOString()),
          ...tenant,
        ]);

        // Pull all items for tenant; we'll filter by header ids in-memory (same as mobile analytics)
        const items = await list<SaleItemDoc>(saleItemsCollectionId, [...tenant]);

        setSaleHeaders(headers);
        setSaleItems(items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load sales data');
        setSaleHeaders([]);
        setSaleItems([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [activeOrgId, canQuery, rangeEnd, rangeStart, userId]);

  const stats = useMemo(() => {
    const startTs = new Date(`${rangeStart}T00:00:00.000Z`).getTime();
    const endTs = new Date(`${rangeEnd}T23:59:59.999Z`).getTime();

    const periodHeaders = saleHeaders
      .filter((h) => {
        const ts = tsOf(h);
        if (ts < startTs || ts > endTs) return false;
        if (h.status === 'canceled') return false;
        const st = String(h.status || 'completed');
        if (status !== 'all' && st !== status) return false;
        if (paymentMethod !== 'all' && pmOf(h) !== paymentMethod) return false;
        return true;
      })
      .sort((a, b) => tsOf(a) - tsOf(b));

    const headerIds = new Set(periodHeaders.map((h) => h.$id));

    let revenue = 0;
    let cost = 0;
    let itemsSold = 0;
    const paymentBreakdown: Record<string, number> = {};

    periodHeaders.forEach((h) => {
      const val = totalOf(h);
      revenue += val;
      const pm = pmOf(h);
      paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + val;
    });

    saleItems.forEach((it) => {
      if (!headerIds.has(it.saleId)) return;
      const qty = Number(it.quantity || 0);
      itemsSold += qty;
      cost += itemCost(it);
    });

    return {
      orders: periodHeaders.length,
      revenue,
      cost,
      grossProfit: revenue - cost,
      itemsSold,
      paymentBreakdown,
    };
  }, [paymentMethod, rangeEnd, rangeStart, saleHeaders, saleItems, status]);

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    for (const h of saleHeaders) set.add(pmOf(h));
    return ['all', ...Array.from(set).sort()];
  }, [saleHeaders]);

  return (
    <div className="page-shell">
      <section className="page-card">
        <div className="release-meta" style={{ marginBottom: '0.75rem' }}>
          <span className="text-eyebrow">Owner dashboard</span>
          <span className="release-meta-dot" />
          <span>Organizations + Sales analytics</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className="text-heading">Analytics overview</h1>
            <p className="text-subtitle" style={{ marginTop: '0.5rem' }}>
              Mirrors the DashingBakery in-app analytics: date range filtering, canceled exclusion, and payment breakdown.
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
            <p className="stacked-list-meta">{activeOrgId ? `orgId: ${activeOrgId}` : 'orgId: —'}</p>

            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
              <div className="page-card page-card-muted">
                <p className="text-eyebrow">Orders</p>
                <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
                  {loading ? 'Loading…' : `${stats?.orders ?? 0}`}
                </p>
                <p className="stacked-list-meta">Excludes canceled</p>
              </div>
              <div className="page-card page-card-muted">
                <p className="text-eyebrow">Revenue</p>
                <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
                  {(stats?.revenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="stacked-list-meta">From sale header `total`</p>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
              <div className="page-card page-card-muted">
                <p className="text-eyebrow">Cost</p>
                <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
                  {(stats?.cost ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="stacked-list-meta">From sale items `hppSnapshotEach`</p>
              </div>
              <div className="page-card page-card-muted">
                <p className="text-eyebrow">Gross profit</p>
                <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
                  {(stats?.grossProfit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="stacked-list-meta">Revenue − cost</p>
              </div>
              <div className="page-card page-card-muted">
                <p className="text-eyebrow">Items sold</p>
                <p className="stacked-list-title" style={{ marginTop: '0.35rem' }}>
                  {stats?.itemsSold ?? 0}
                </p>
                <p className="stacked-list-meta">Sum of quantities</p>
              </div>
            </div>
          </div>

          <div className="page-card">
            <p className="text-eyebrow">Filters</p>

            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
              <label className="stacked-list-body">
                Date start
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  style={{ display: 'block', marginTop: 6, width: '100%', padding: '0.5rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}
                />
              </label>
              <label className="stacked-list-body">
                Date end
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  style={{ display: 'block', marginTop: 6, width: '100%', padding: '0.5rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}
                />
              </label>
              <label className="stacked-list-body">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ display: 'block', marginTop: 6, width: '100%', padding: '0.5rem', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
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

              {!salesCollectionId || !saleItemsCollectionId ? (
                <p className="muted-text">
                  Missing Appwrite env vars. Set <code>VITE_APPWRITE_DB_ID</code>, <code>VITE_APPWRITE_SALES_COLLECTION_ID</code>, and <code>VITE_APPWRITE_SALE_ITEMS_COLLECTION_ID</code>.
                </p>
              ) : null}

              {error ? <p className="muted-text">Error: {error}</p> : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }} className="page-card page-card-muted">
          <p className="text-eyebrow">Payment breakdown</p>
          <p className="muted-text" style={{ marginTop: '0.35rem' }}>
            Totals grouped by <code>paymentMethod</code> from sales headers (same as DashingBakery analytics).
          </p>

          <ul className="stacked-list" style={{ marginTop: '1rem' }}>
            {Object.entries(stats?.paymentBreakdown || {})
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount]) => (
                <li key={method}>
                  <p className="stacked-list-title">
                    {method} · {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="stacked-list-meta">From sales headers</p>
                </li>
              ))}
            {!loading && (!stats || Object.keys(stats.paymentBreakdown).length === 0) ? (
              <li>
                <p className="stacked-list-body">No sales found for the current filters.</p>
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
};

