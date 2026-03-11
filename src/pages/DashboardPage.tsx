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
import { Lock, TrendingUp, AlertCircle, ShoppingBasket, Package, ShoppingBag } from 'lucide-react';
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
  const { isPremium, clerkUserId } = useUserData();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({ userMemberships: true });
  const organizationList = userMemberships?.data ?? [];
  const [activeOrgId, setActiveOrgId] = useState<string | undefined>(undefined);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [rangeStart, setRangeStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to last 7 days for more immediate detail
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

  const canQuery = Boolean(clerkUserId);

  useEffect(() => {
    async function load() {
      if (!canQuery) return;
      setLoading(true);
      setError(null);

      const startTs = new Date(`${rangeStart}T00:00:00.000Z`).getTime();
      const endTs = new Date(`${rangeEnd}T23:59:59.999Z`).getTime();
      const tenant = tenantQueries(clerkUserId, activeOrgId);

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
  }, [activeOrgId, canQuery, rangeEnd, rangeStart, clerkUserId]);

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
        productSales[pid].qty += Number(it.quantity || 0);
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
      listHeaders,
    };
  }, [rangeStart, rangeEnd, saleHeaders, saleItems, expenses, productsById, categoriesById, statusFilter, paymentFilter]);

  const paymentOptions = useMemo(() => {
    const set = new Set<string>();
    saleHeaders.forEach((h) => set.add(pmOf(h)));
    return ['all', ...Array.from(set).sort()];
  }, [saleHeaders]);

  return (
    <div className="page-shell dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="text-heading">Web Dashboard</h1>
          <p className="text-subtitle">Manage your BCash POS data from anywhere.</p>
        </div>
        <div className="dashboard-org-pill">
            <span className="org-label">Organization</span>
            <select
                className="org-select"
                value={activeOrgId}
                onChange={(e) => setActiveOrgId(e.target.value)}
            >
                {organizationList.map(m => (
                    <option key={m.organization.id} value={m.organization.id}>
                        {m.organization.name}
                    </option>
                ))}
            </select>
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dashboard-select">
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label>
              <span className="dashboard-label">Payment</span>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="dashboard-select">
                  {paymentOptions.map(m => (
                      <option key={m} value={m}>{m === 'all' ? 'All' : PAYMENT_LABELS[m] || m}</option>
                  ))}
              </select>
          </label>
        </div>
      </div>

      {error && <div className="dashboard-error-banner"><AlertCircle size={16} /> {error}</div>}

      {loading && saleHeaders.length === 0 ? (
          <div className="dashboard-loading-state">Loading data...</div>
      ) : (
        <>
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
                {stats.canceledCount > 0 && (
                    <div className="dashboard-kpi-card canceled-kpi">
                        <span className="kpi-label">Canceled</span>
                        <span className="kpi-value" style={{ color: DANGER }}>{stats.canceledCount}</span>
                        <span className="kpi-meta">transactions lost</span>
                    </div>
                )}
            </div>

            {!isPremium ? (
                <div className="dashboard-locked-section">
                    <div className="locked-banner">
                        <Lock size={40} className="lock-icon" />
                        <h2>Advanced Analytics Required Premium</h2>
                        <p>Upgrade to Basic or Premium plan for full access to charts, product reports, and performance data.</p>
                        <div className="locked-actions">
                             <a href="/download" className="app-btn-primary">Get Premium in App</a>
                        </div>
                    </div>

                    <div className="dashboard-card plain-list">
                        <h3 className="dashboard-card-title">Recent Transactions</h3>
                        <div className="dashboard-table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Date/Time</th>
                                        <th>ID</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th align="right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...stats.listHeaders].reverse().slice(0, 15).map(h => (
                                        <tr key={h.$id}>
                                            <td>{new Date(tsOf(h)).toLocaleString()}</td>
                                            <td className="text-muted">#{h.$id.slice(-6).toUpperCase()}</td>
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
            ) : (
                <div className="dashboard-premium-analytics">
                    <div className="dashboard-charts-grid">
                        <div className="dashboard-card chart-main">
                            <h3 className="dashboard-card-title">Revenue Trend</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <XAxis dataKey="label" stroke={MUTED} fontSize={11} />
                                    <YAxis stroke={MUTED} fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                                    <Tooltip formatter={v => [`Rp${Number(v).toLocaleString()}`, 'Revenue']} />
                                    <Area type="monotone" dataKey="value" stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.1} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="dashboard-card">
                            <h3 className="dashboard-card-title">Top Hours</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.topHours}>
                                    <XAxis dataKey="name" stroke={MUTED} fontSize={11} />
                                    <Tooltip formatter={v => [`Rp${Number(v).toLocaleString()}`, 'Sales']} />
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
                                    <Tooltip formatter={v => `Rp${Number(v).toLocaleString()}`} />
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
                            <h3 className="dashboard-card-title">Inventory Health</h3>
                            <div className="health-grid">
                                <div className="health-stat">
                                    <ShoppingBasket size={24} color={PRIMARY} />
                                    <div>
                                        <span className="health-val">{products.length}</span>
                                        <span className="health-label">Total Products</span>
                                    </div>
                                </div>
                                <div className="health-stat">
                                    <Package size={24} color={PRIMARY} />
                                    <div>
                                        <span className="health-val">{categories.length}</span>
                                        <span className="health-label">Categories</span>
                                    </div>
                                </div>
                                <div className="health-stat">
                                    <ShoppingBag size={24} color={DANGER} />
                                    <div>
                                        <span className="health-val">{expenses.length}</span>
                                        <span className="health-label">Expense Logs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3 className="dashboard-card-title">Daily Transactions</h3>
                        <div className="dashboard-table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Items</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th align="right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...stats.listHeaders].reverse().slice(0, 30).map(h => (
                                        <tr key={h.$id}>
                                            <td>{new Date(tsOf(h)).toLocaleString()}</td>
                                            <td>--</td>
                                            <td>{pmOf(h).toUpperCase()}</td>
                                            <td><span className={`badge-${h.status || 'completed'}`}>{h.status || 'completed'}</span></td>
                                            <td align="right" className="font-bold">Rp{totalOf(h).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};
