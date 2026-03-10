import { useEffect, useMemo, useState } from 'react';
import { useAuth, useOrganizationList } from '@clerk/react';
import { Query } from 'appwrite';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './pages.css';
import {
  categoriesCollectionId,
  expensesCollectionId,
  productsCollectionId,
  saleItemsCollectionId,
  salesCollectionId,
} from '../lib/appwrite';
import { list, tenantQueries } from '../lib/repo';

const PRIMARY = '#3d7066';
const SUCCESS = '#22C55E';
const WARNING = '#EAB308';
const DANGER = '#EF4444';
const MUTED = '#8a9e9a';

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
  saleId: string;
  productId?: string;
  quantity: number;
  priceEach?: number;
  hppSnapshotEach?: number;
  price?: number;
  cost?: number;
  orgId?: string | null;
};

type ProductDoc = { $id: string; name?: string; categoryId?: string };
type CategoryDoc = { $id: string; name?: string; color?: string };
type ExpenseDoc = { $id: string; amount?: number; timestamp?: string; $createdAt?: string };

function tsOf(doc: { timestamp?: string; $createdAt: string }) {
  return new Date(doc.timestamp || doc.$createdAt).getTime();
}
function pmOf(h: SaleHeaderDoc) {
  return String(h.paymentMethod || 'cash').toLowerCase();
}
function totalOf(h: SaleHeaderDoc) {
  return Number(h.total || 0);
}
function itemCost(it: SaleItemDoc) {
  return (Number(it.hppSnapshotEach ?? it.cost ?? 0) * Number(it.quantity || 0));
}
function itemRevenue(it: SaleItemDoc) {
  return (Number(it.priceEach ?? it.price ?? 0) * Number(it.quantity || 0));
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Transfer',
  qris: 'QRIS',
  'debit card': 'Debit Card',
  'credit card': 'Credit Card',
  'e-wallet': 'E-Wallet',
};

export const DashboardPage = () => {
  const { isLoaded, userId } = useAuth();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({ userMemberships: true });
  const organizationList = userMemberships?.data ?? [];
  const [activeOrgId, setActiveOrgId] = useState<string | undefined>(undefined);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [rangeStart, setRangeStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [rangeEnd, setRangeEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [saleHeaders, setSaleHeaders] = useState<SaleHeaderDoc[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItemDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgsLoaded && organizationList && organizationList.length > 0 && activeOrgId === undefined) {
      setActiveOrgId(organizationList[0].organization.id);
    }
  }, [orgsLoaded, organizationList, activeOrgId]);

  const canQuery = Boolean(isLoaded && userId);

  useEffect(() => {
    async function load() {
      if (!canQuery) return;
      setLoading(true);
      setError(null);
      const startTs = new Date(`${rangeStart}T00:00:00.000Z`).getTime();
      const endTs = new Date(`${rangeEnd}T23:59:59.999Z`).getTime();
      const tenant = tenantQueries(userId!, activeOrgId);
      try {
        const [headers, items, prods, cats, exps] = await Promise.all([
          list<SaleHeaderDoc>(salesCollectionId, [
            Query.greaterThanEqual('timestamp', new Date(startTs).toISOString()),
            Query.lessThanEqual('timestamp', new Date(endTs).toISOString()),
            ...tenant,
          ]),
          list<SaleItemDoc>(saleItemsCollectionId, [...tenant]),
          list<ProductDoc>(productsCollectionId, [...tenant]),
          list<CategoryDoc>(categoriesCollectionId, [...tenant]),
          list<ExpenseDoc>(expensesCollectionId, [...tenant]),
        ]);
        setSaleHeaders(headers);
        setSaleItems(items);
        setProducts(prods);
        setCategories(cats);
        setExpenses(exps);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
        setSaleHeaders([]);
        setSaleItems([]);
        setProducts([]);
        setCategories([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activeOrgId, canQuery, rangeEnd, rangeStart, userId]);

  const productsById = useMemo(() => {
    const m: Record<string, ProductDoc> = {};
    products.forEach((p) => (m[p.$id] = p));
    return m;
  }, [products]);
  const categoriesById = useMemo(() => {
    const m: Record<string, CategoryDoc> = {};
    categories.forEach((c) => (m[c.$id] = c));
    return m;
  }, [categories]);

  const stats = useMemo(() => {
    const startTs = new Date(`${rangeStart}T00:00:00.000Z`).getTime();
    const endTs = new Date(`${rangeEnd}T23:59:59.999Z`).getTime();

    const itemsBySaleId: Record<string, SaleItemDoc[]> = {};
    saleItems.forEach((it) => {
      if (!itemsBySaleId[it.saleId]) itemsBySaleId[it.saleId] = [];
      itemsBySaleId[it.saleId].push(it);
    });

    // Headers in date range: for stats we exclude canceled (like client); for list we filter by statusFilter
    const inRange = saleHeaders
      .filter((h) => {
        const ts = tsOf(h);
        return ts >= startTs && ts <= endTs;
      })
      .sort((a, b) => tsOf(a) - tsOf(b));

    const completedOnly = inRange.filter((h) => h.status !== 'canceled');
    let revenue = 0,
      cost = 0,
      itemsSold = 0;
    const productSales: Record<string, { qty: number; revenue: number; cost: number }> = {};
    const dailySales: Record<string, number> = {};
    const categorySales: Record<string, number> = {};
    const paymentBreakdown: Record<string, number> = {};
    const hourlyBreakdown: Record<number, number> = {};

    completedOnly.forEach((h) => {
      const d = new Date(h.timestamp || h.$createdAt);
      const val = totalOf(h);
      revenue += val;
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      dailySales[dateStr] = (dailySales[dateStr] || 0) + val;
      const hour = d.getHours();
      hourlyBreakdown[hour] = (hourlyBreakdown[hour] || 0) + val;
      const pm = pmOf(h);
      paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + val;
      const lines = itemsBySaleId[h.$id] || [];
      lines.forEach((it) => {
        const c = itemCost(it);
        const r = itemRevenue(it);
        cost += c;
        itemsSold += Number(it.quantity || 0);
        const pid = it.productId ?? '';
        if (!productSales[pid]) productSales[pid] = { qty: 0, revenue: 0, cost: 0 };
        productSales[pid].qty += it.quantity || 0;
        productSales[pid].revenue += r;
        productSales[pid].cost += c;
        const catId = productsById[pid]?.categoryId;
        if (catId) categorySales[catId] = (categorySales[catId] || 0) + r;
      });
    });

    const periodExpenses = expenses
      .filter((e) => {
        const ts = new Date(e.timestamp ?? e.$createdAt ?? 0).getTime();
        return ts >= startTs && ts <= endTs;
      })
      .reduce((s, e) => s + (e.amount || 0), 0);
    const grossProfit = revenue - cost;
    const netProfit = grossProfit - periodExpenses;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const avgTicket = completedOnly.length > 0 ? revenue / completedOnly.length : 0;
    const canceledCount = inRange.filter((h) => h.status === 'canceled').length;

    const bestSelling = Object.entries(productSales)
      .map(([id, s]) => ({ id, name: productsById[id]?.name || 'Unknown', ...s }))
      .sort((a, b) => b.revenue - a.revenue);

    const categoryData = Object.entries(categorySales)
      .map(([id, rev]) => ({
        id,
        name: categoriesById[id]?.name || 'Other',
        revenue: rev,
        color: categoriesById[id]?.color || PRIMARY,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const diffDays = Math.ceil((endTs - startTs) / (1000 * 60 * 60 * 24));
    const chartData: { label: string; value: number; date: string }[] = [];
    for (let i = 0; i <= Math.min(diffDays, 31); i++) {
      const d = new Date(rangeStart ?? '');
      d.setDate(d.getDate() + i);
      const ds = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      chartData.push({ label: ds.replace('/', '-'), value: dailySales[ds] || 0, date: ds });
    }

    const hourlyData = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      name: `${h}:00`,
      value: hourlyBreakdown[h] || 0,
    }));
    const topHours = [...hourlyData].sort((a, b) => b.value - a.value).slice(0, 5).filter((h) => h.value > 0);

    const paymentData = Object.entries(paymentBreakdown)
      .map(([method, amount]) => ({
        name: PAYMENT_LABELS[method] || method.charAt(0).toUpperCase() + method.slice(1),
        value: amount,
      }))
      .sort((a, b) => b.value - a.value);

    const pieCategoryData = categoryData.map((c) => ({ name: c.name, value: c.revenue, color: c.color }));

    // Transaction list: filter by statusFilter (all = inRange, completed = non-canceled, canceled = only canceled)
    let listHeaders = inRange;
    if (statusFilter === 'completed') listHeaders = completedOnly;
    else if (statusFilter === 'canceled') listHeaders = inRange.filter((h) => h.status === 'canceled');
    if (paymentFilter !== 'all') listHeaders = listHeaders.filter((h) => pmOf(h) === paymentFilter);

    return {
      revenue,
      cost,
      grossProfit,
      totalExpenses: periodExpenses,
      netProfit,
      margin,
      transactionCount: completedOnly.length,
      canceledCount,
      itemsSold,
      avgTicket,
      bestSelling,
      categoryData,
      chartData,
      hourlyData,
      topHours,
      paymentData,
      pieCategoryData,
      listHeaders,
    };
  }, [
    rangeStart,
    rangeEnd,
    saleHeaders,
    saleItems,
    expenses,
    productsById,
    categoriesById,
    statusFilter,
    paymentFilter,
  ]);

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    saleHeaders.forEach((h) => set.add(pmOf(h)));
    return ['all', ...Array.from(set).sort()];
  }, [saleHeaders]);

  return (
    <div className="page-shell dashboard-page">
      {/* Org tabs – keep, do not remove */}
      <div className="dashboard-org-bar">
        <span className="dashboard-org-label">Organization</span>
        <div className="dashboard-org-tabs">
          {orgsLoaded && organizationList && organizationList.length > 0 ? (
            organizationList.map((m) => {
              const org = m.organization;
              const active = activeOrgId === org.id;
              return (
                <button
                  key={org.id}
                  type="button"
                  className={active ? 'dashboard-org-tab active' : 'dashboard-org-tab'}
                  onClick={() => setActiveOrgId(org.id)}
                >
                  {org.name}
                </button>
              );
            })
          ) : (
            <span className="dashboard-org-none">No organization</span>
          )}
        </div>
      </div>

      <div className="dashboard-toolbar">
        <div className="dashboard-dates">
          <label>
            <span className="dashboard-label">From</span>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="dashboard-input"
            />
          </label>
          <label>
            <span className="dashboard-label">To</span>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="dashboard-input"
            />
          </label>
        </div>
        <div className="dashboard-filters">
          <label>
            <span className="dashboard-label">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="dashboard-select"
            >
              <option value="all">All (incl. canceled)</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled only</option>
            </select>
          </label>
          <label>
            <span className="dashboard-label">Payment</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="dashboard-select"
            >
              {paymentMethods.map((m: string) => (
                <option key={m} value={m}>
                  {m === 'all' ? 'All' : PAYMENT_LABELS[m] || m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {loading && saleHeaders.length === 0 ? (
        <div className="dashboard-loading">Loading…</div>
      ) : (
        <>
          {/* KPI cards – same as client */}
          <div className="dashboard-kpi-grid">
            <div className="dashboard-kpi dashboard-kpi-primary">
              <span className="dashboard-kpi-label">Net Sales</span>
              <span className="dashboard-kpi-value">
                {stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="dashboard-kpi" style={{ borderLeftColor: stats.netProfit >= 0 ? SUCCESS : DANGER }}>
              <span className="dashboard-kpi-label">Net Profit</span>
              <span className="dashboard-kpi-value" style={{ color: stats.netProfit >= 0 ? SUCCESS : DANGER }}>
                {(stats.netProfit >= 0 ? '' : '−')}
                {Math.abs(stats.netProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="dashboard-kpi" style={{ borderLeftColor: WARNING }}>
              <span className="dashboard-kpi-label">Transactions</span>
              <span className="dashboard-kpi-value">{stats.transactionCount}</span>
              {stats.canceledCount > 0 && (
                <span className="dashboard-kpi-meta">Canceled: {stats.canceledCount}</span>
              )}
            </div>
            <div className="dashboard-kpi" style={{ borderLeftColor: PRIMARY }}>
              <span className="dashboard-kpi-label">Items Sold</span>
              <span className="dashboard-kpi-value">{stats.itemsSold.toLocaleString()}</span>
            </div>
          </div>
          <div className="dashboard-metrics-row">
            <div className="dashboard-metric-chip">
              <span className="dashboard-metric-l">Avg. Ticket</span>
              <span className="dashboard-metric-v">
                {stats.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="dashboard-metric-chip">
              <span className="dashboard-metric-l">Margin</span>
              <span className="dashboard-metric-v" style={{ color: stats.margin >= 0 ? SUCCESS : DANGER }}>
                {stats.margin.toFixed(1)}%
              </span>
            </div>
            <div className="dashboard-metric-chip">
              <span className="dashboard-metric-l">Expenses</span>
              <span className="dashboard-metric-v" style={{ color: DANGER }}>
                −{stats.totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Revenue trend – line/area chart */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title">Revenue over time</h3>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke={MUTED} />
                  <YAxis tick={{ fontSize: 10 }} stroke={MUTED} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [Number(v).toLocaleString(), 'Revenue']} labelFormatter={(l) => l} />
                  <Area type="monotone" dataKey="value" stroke={PRIMARY} fill="url(#areaGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="value" stroke={PRIMARY} dot={{ r: 3 }} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-empty-chart">No data in this period</div>
            )}
          </div>

          <div className="dashboard-charts-row">
            {/* Hourly sales – bar chart */}
            <div className="dashboard-card dashboard-card-half">
              <h3 className="dashboard-card-title">Peak selling hours</h3>
              {stats.topHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.topHours} layout="vertical" margin={{ top: 4, right: 8, left: 36, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke={MUTED} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke={MUTED} width={32} />
                    <Tooltip formatter={(v) => [Number(v).toLocaleString(), 'Sales']} />
                    <Bar dataKey="value" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-empty-chart">No hourly data</div>
              )}
            </div>

            {/* Payment methods – pie */}
            <div className="dashboard-card dashboard-card-half">
              <h3 className="dashboard-card-title">Payment methods</h3>
              {stats.paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {stats.paymentData.map((_, i) => (
                        <Cell key={i} fill={[PRIMARY, SUCCESS, WARNING, MUTED, DANGER][i % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [Number(v).toLocaleString(), '']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-empty-chart">No payment data</div>
              )}
            </div>
          </div>

          {/* Category distribution – pie */}
          {stats.pieCategoryData.length > 0 && (
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">By category</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats.pieCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {stats.pieCategoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color || PRIMARY} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [Number(v).toLocaleString(), '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Best selling products */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title">Best selling products</h3>
            {stats.bestSelling.length > 0 ? (
              <ul className="dashboard-list">
                {stats.bestSelling.slice(0, 10).map((p, idx) => (
                  <li key={p.id} className="dashboard-list-item">
                    <span className="dashboard-rank">{idx + 1}</span>
                    <span className="dashboard-list-name">{p.name}</span>
                    <span className="dashboard-list-meta">
                      {p.qty} sold · {((p.revenue - p.cost) / (p.revenue || 1) * 100).toFixed(0)}% margin
                    </span>
                    <span className="dashboard-list-value">{p.revenue.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-empty-chart">No product sales</div>
            )}
          </div>

          {/* Transaction list – includes canceled when status = all */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title">Transactions {stats.listHeaders.length > 0 && `(${stats.listHeaders.length})`}</h3>
            {stats.listHeaders.length > 0 ? (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.listHeaders].reverse().slice(0, 50).map((h) => (
                      <tr key={h.$id} className={h.status === 'canceled' ? 'dashboard-row-canceled' : ''}>
                        <td>{new Date(h.timestamp || h.$createdAt).toLocaleString()}</td>
                        <td>{totalOf(h).toLocaleString()}</td>
                        <td>{pmOf(h)}</td>
                        <td>
                          <span className={h.status === 'canceled' ? 'dashboard-badge canceled' : 'dashboard-badge completed'}>
                            {h.status || 'completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dashboard-empty-chart">No transactions in this range</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
