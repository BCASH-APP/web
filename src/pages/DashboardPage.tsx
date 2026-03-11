import { useEffect, useMemo, useState } from 'react';
import { useOrganizationList } from '@clerk/react';
import { Query } from 'appwrite';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Lock,
  TrendingUp,
  AlertCircle,
  ShoppingBasket,
  Package,
  ShoppingBag,
  Plus,
  Tags,
  BookOpen,
  LayoutDashboard,
  BarChart2,
  // ChevronRight,
} from 'lucide-react';
import './pages.css';
import {
  categoriesCollectionId,
  expensesCollectionId,
  productsCollectionId,
  saleItemsCollectionId,
  salesCollectionId,
} from '../lib/appwrite';
import { list, tenantQueries } from '../lib/repo';
import { useUserData } from '../lib/useUserData';

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
  return Number(it.hppSnapshotEach ?? it.cost ?? 0) * Number(it.quantity || 0);
}
function itemRevenue(it: SaleItemDoc) {
  return Number(it.priceEach ?? it.price ?? 0) * Number(it.quantity || 0);
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
  const { planId, clerkUserId } = useUserData();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({ userMemberships: true });
  const organizationList = userMemberships?.data ?? [];
  const [activeStoreId, setActiveStoreId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'home' | 'analytics'>('home');

  const hasAnalyticsAccess = planId === 'premium';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [rangeStart, setRangeStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
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
    if (orgsLoaded && organizationList.length > 0 && activeStoreId === undefined) {
      setActiveStoreId(organizationList[0].organization.id);
    }
  }, [orgsLoaded, organizationList, activeStoreId]);

  const canQuery = Boolean(clerkUserId);

  useEffect(() => {
    async function load() {
      if (!canQuery) return;
      setLoading(true);
      setError(null);

      const startTs = new Date(`${rangeStart}T00:00:00.000Z`).getTime();
      const endTs = new Date(`${rangeEnd}T23:59:59.999Z`).getTime();
      const tenant = tenantQueries(clerkUserId, activeStoreId);

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
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activeStoreId, canQuery, rangeEnd, rangeStart, clerkUserId]);

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

    const now = new Date();
    const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const itemsBySaleId: Record<string, SaleItemDoc[]> = {};
    saleItems.forEach((it) => {
      if (!itemsBySaleId[it.saleId]) itemsBySaleId[it.saleId] = [];
      itemsBySaleId[it.saleId].push(it);
    });

    const inRange = saleHeaders
      .filter((h) => {
        const ts = tsOf(h);
        return ts >= startTs && ts <= endTs;
      })
      .sort((a, b) => tsOf(a) - tsOf(b));

    const completedOnly = inRange.filter((h) => h.status !== 'canceled');

    let revenue = 0,
      cost = 0,
      itemsSold = 0,
      todayRevenue = 0,
      todaySalesCount = 0;

    const productSales: Record<string, { qty: number; revenue: number; cost: number }> = {};
    const dailySales: Record<string, number> = {};
    const categorySales: Record<string, number> = {};
    const paymentBreakdown: Record<string, number> = {};
    const hourlyBreakdown: Record<number, number> = {};

    completedOnly.forEach((h) => {
      const ts = tsOf(h);
      const val = totalOf(h);
      revenue += val;

      if (ts >= todayTs) {
        todayRevenue += val;
        todaySalesCount++;
      }

      const d = new Date(ts);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      dailySales[dateStr] = (dailySales[dateStr] || 0) + val;
      const hour = d.getHours();
      hourlyBreakdown[hour] = (hourlyBreakdown[hour] || 0) + val;
      const pm = pmOf(h);
      paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + val;

      const lines = itemsBySaleId[h.$id] || [];
      lines.forEach((it: SaleItemDoc) => {
        const c = itemCost(it);
        const r = itemRevenue(it);
        cost += c;
        itemsSold += Number(it.quantity || 0);
        const pid = it.productId ?? '';
        if (!productSales[pid]) productSales[pid] = { qty: 0, revenue: 0, cost: 0 };
        productSales[pid].qty += Number(it.quantity || 0);
        productSales[pid].revenue += r;
        productSales[pid].cost += c;
        const catId = productsById[pid]?.categoryId;
        if (catId) categorySales[catId] = (categorySales[catId] || 0) + r;
      });
    });

    const periodExpenses = expenses
      .filter((e) => {
        const ts = tsOf({ $createdAt: e.$createdAt, timestamp: e.timestamp } as any);
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

    const chartData: { label: string; value: number; date: string }[] = [];
    const diffDays = Math.ceil((endTs - startTs) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= Math.min(diffDays, 31); i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      const ds = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      chartData.push({ label: ds.replace('/', '-'), value: dailySales[ds] || 0, date: ds });
    }

    const hourlyData = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      name: `${h}:00`,
      value: hourlyBreakdown[h] || 0,
    }));
    const topHours = [...hourlyData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .filter((h) => h.value > 0);

    const paymentData = Object.entries(paymentBreakdown)
      .map(([method, amount]) => ({
        name: PAYMENT_LABELS[method] || method.charAt(0).toUpperCase() + method.slice(1),
        value: amount,
      }))
      .sort((a, b) => b.value - a.value);

    let listHeaders = inRange;
    if (statusFilter === 'completed') listHeaders = completedOnly;
    else if (statusFilter === 'canceled')
      listHeaders = inRange.filter((h) => h.status === 'canceled');
    if (paymentFilter !== 'all') listHeaders = listHeaders.filter((h) => pmOf(h) === paymentFilter);

    return {
      revenue,
      todayRevenue,
      todaySalesCount,
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

  const paymentOptions = useMemo(() => {
    const set = new Set<string>();
    saleHeaders.forEach((h: SaleHeaderDoc) => set.add(pmOf(h)));
    return ['all', ...Array.from(set).sort()];
  }, [saleHeaders]);

  const storeName = organizationList.find((m) => m.organization.id === activeStoreId)?.organization.name || 'Store';

  return (
    <div className="page-shell dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="text-heading">Web Dashboard</h1>
          <p className="text-subtitle">Manage your BCash POS data from anywhere.</p>
        </div>
        <div className="dashboard-org-pill">
          <span className="org-label">Store</span>
          <select
            className="org-select"
            value={activeStoreId}
            onChange={(e) => setActiveStoreId(e.target.value)}
          >
            {organizationList.map((m) => (
              <option key={m.organization.id} value={m.organization.id}>
                {m.organization.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="dashboard-error-banner" style={{ marginBottom: '1.5rem' }}><AlertCircle size={16} /> {error}</div>}

      {loading && saleHeaders.length === 0 ? (
        <div className="dashboard-loading-state">Loading Store Data...</div>
      ) : (
        <>
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <LayoutDashboard size={16} /> Home
            </button>
            {hasAnalyticsAccess ? (
              <button
                className={`dashboard-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart2 size={16} /> Analytics
              </button>
            ) : (
              <button className="dashboard-tab-btn locked" title="Premium Required">
                <Lock size={14} /> Analytics
              </button>
            )}
          </div>

          {activeTab === 'home' ? (
            <div className="dashboard-mobile-parity">
              <div className="mobile-parity-card">
                <div className="mobile-card-pattern" />
                <div className="mobile-card-header">
                  <span className="mobile-card-subtitle">Today's Revenue</span>
                  <span className="mobile-card-org">{storeName}</span>
                </div>
                <h2 className="mobile-card-revenue">Rp{stats.todayRevenue.toLocaleString()}</h2>
                <div className="mobile-card-stats">
                  <div className="mobile-stat">
                    <span className="mobile-stat-label">Transactions</span>
                    <span className="mobile-stat-val">{stats.todaySalesCount}</span>
                  </div>
                  <div className="mobile-stat-divider" />
                  <div className="mobile-stat">
                    <span className="mobile-stat-label">Total Revenue</span>
                    <span className="mobile-stat-val">Rp{(stats.revenue / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-content-grid">
                <div className="dashboard-card action-section">
                  <h3 className="dashboard-card-title">Quick Access</h3>
                  <div className="web-action-grid">
                    <div className="web-action-card primary">
                      <div className="action-icon"><Plus size={20} /></div>
                      <div className="action-info">
                        <span className="action-label">New Sale</span>
                        <span className="action-sub">Record a sale</span>
                      </div>
                    </div>
                    <div className="web-action-card">
                      <div className="action-icon"><ShoppingBag size={20} /></div>
                      <div className="action-info">
                        <span className="action-label">Today Sold</span>
                        <span className="action-sub">Check items sold</span>
                      </div>
                    </div>
                    <div className="web-action-card">
                      <div className="action-icon"><ShoppingBasket size={20} /></div>
                      <div className="action-info">
                        <span className="action-label">Products</span>
                        <span className="action-sub">Manage items</span>
                      </div>
                    </div>
                    <div className="web-action-card">
                      <div className="action-icon"><Tags size={20} /></div>
                      <div className="action-info">
                        <span className="action-label">Categories</span>
                        <span className="action-sub">Item categories</span>
                      </div>
                    </div>
                    <div className={`web-action-card ${planId === 'free_trial' ? 'disabled' : ''}`}>
                      <div className="action-icon"><Package size={20} /></div>
                      <div className="action-info">
                        <span className="action-label">Stock</span>
                        <span className="action-sub">Inventory</span>
                      </div>
                      {planId === 'free_trial' && <Lock size={12} className="lock-tag" />}
                    </div>
                    <div className={`web-action-card ${planId === 'free_trial' ? 'disabled' : ''}`}>
                      <div className="action-icon"><BookOpen size={20} /></div>
                      <div className="action-info">
                        <span className="action-label">Recipes</span>
                        <span className="action-sub">Manage menu</span>
                      </div>
                      {planId === 'free_trial' && <Lock size={12} className="lock-tag" />}
                    </div>
                  </div>
                </div>

                <div className="mini-stats-grid">
                  <div className="mini-stat-box">
                    <div className="mini-icon-bg"><ShoppingBasket size={18} /></div>
                    <div>
                      <span className="mini-box-val">{products.length}</span>
                      <span className="mini-box-label">Active Products</span>
                    </div>
                  </div>
                  <div className="mini-stat-box">
                    <div className="mini-icon-bg"><Package size={18} /></div>
                    <div>
                      <span className="mini-box-val">{categories.length}</span>
                      <span className="mini-box-label">Raw Materials</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card transactions-card">
                  <h3 className="dashboard-card-title">Recent Transactions</h3>
                  <div className="dashboard-table-wrap">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th align="right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...stats.listHeaders]
                          .reverse()
                          .slice(0, 10)
                          .map((h: SaleHeaderDoc) => (
                            <tr key={h.$id}>
                              <td>{new Date(tsOf(h)).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                              <td>{pmOf(h).toUpperCase()}</td>
                              <td>
                                <span className={`badge-${h.status || 'completed'}`}>
                                  {(h.status || 'completed').toUpperCase()}
                                </span>
                              </td>
                              <td align="right" className="font-bold">Rp{totalOf(h).toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dashboard-premium-analytics">
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
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dashboard-select">
                      <option value="all">All</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </label>
                  <label>
                    <span className="dashboard-label">Payment</span>
                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="dashboard-select">
                      {paymentOptions.map((m) => (
                        <option key={m} value={m}>{m === 'all' ? 'All' : PAYMENT_LABELS[m] || m}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="dashboard-kpi-grid">
                <div className="dashboard-kpi-card main-kpi">
                  <span className="kpi-label">Revenue</span>
                  <span className="kpi-value">Rp{stats.revenue.toLocaleString()}</span>
                  <div className="kpi-trend">
                    <TrendingUp size={12} /> {stats.transactionCount} transactions
                  </div>
                </div>
                <div className="dashboard-kpi-card">
                  <span className="kpi-label">Profit</span>
                  <span className="kpi-value" style={{ color: stats.netProfit >= 0 ? SUCCESS : DANGER }}>
                    Rp{stats.netProfit.toLocaleString()}
                  </span>
                  <span className="kpi-meta">{stats.margin.toFixed(1)}% margin</span>
                </div>
                <div className="dashboard-kpi-card">
                  <span className="kpi-label">Avg. Ticket</span>
                  <span className="kpi-value">Rp{stats.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="kpi-meta">per sale</span>
                </div>
              </div>

              <div className="dashboard-charts-main">
            <div className="dashboard-card chart-hero">
              <h3 className="dashboard-card-title">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.chartData}>
                  <XAxis dataKey="label" stroke={MUTED} fontSize={11} />
                  <YAxis stroke={MUTED} fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`Rp${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="value" stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-charts-row">
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Peak Hours</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topHours}>
                  <XAxis dataKey="name" stroke={MUTED} fontSize={11} />
                  <Tooltip formatter={(v) => [`Rp${Number(v).toLocaleString()}`, 'Sales']} />
                  <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.paymentData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.paymentData.map((_, index) => (
                      <Cell key={index} fill={[PRIMARY, SUCCESS, WARNING, DANGER, MUTED][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `Rp${Number(v).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

              <div className="dashboard-two-col">
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">Best Selling Products</h3>
                  <div className="prod-list">
                    {stats.bestSelling.slice(0, 8).map((p, idx) => (
                      <div key={p.id} className="prod-row">
                        <div className="prod-rank">{idx + 1}</div>
                        <div className="prod-info">
                          <span className="prod-name">{p.name}</span>
                          <span className="prod-qty">{p.qty} sold</span>
                        </div>
                        <div className="prod-revenue">Rp{p.revenue.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.categoryData}
                        dataKey="revenue"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                      >
                        {stats.categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color || PRIMARY} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `Rp${Number(v).toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
