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
  Package,
  ShoppingBasket,
  Tags,
  Utensils,
  LayoutDashboard,
  BarChart2,
  History,
  ChevronRight,
  Search,
  Plus,
  Users,
  Edit2,
  Trash2,
  X,
  Smartphone,
  Banknote,
  CreditCard,
} from 'lucide-react';
import logoIcon from '../assets/appIcon/splash-icon-transparant.png';
import './pages.css';
import './dashboard-pro.css';
import {
  categoriesCollectionId,
  expensesCollectionId,
  productsCollectionId,
  saleItemsCollectionId,
  salesCollectionId,
  ingredientsCollectionId,
  recipesCollectionId,
  bucketId,
  storage,
  appwriteClient,
  databaseId,
} from '../lib/appwrite';
import { create, list, remove, tenantQueries, update } from '../lib/repo';
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
  itemCount?: number; // Calculated or if available
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

type ProductDoc = {
  $id: string;
  name?: string;
  categoryId?: string;
  price?: number;
  cost?: number;
  imageUrl?: string;
  imageFileId?: string;
  usesRecipe?: boolean;
  recipeId?: string;
  categoryName?: string;
};
type CategoryDoc = { $id: string; name?: string; color?: string };
type ExpenseDoc = { $id: string; amount?: number; timestamp?: string; $createdAt?: string };
type IngredientDoc = {
  $id: string;
  name?: string;
  unitType?: string;
  baseUnit?: string;
  costPerUnit?: number;
  stockQtyBase?: number;
  minStockThreshold?: number;
};
type RecipeDoc = {
  $id: string;
  name?: string;
  yield?: number;
  overheadPercent?: number;
};

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


type ModalProps = {
  type: string;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
  categories: CategoryDoc[];
  recipes: RecipeDoc[];
  loading: boolean;
};

const ManagementModal: React.FC<ModalProps> = ({ type, onClose, onSave, initialData, categories, recipes, loading }) => {
  const [formData, setFormData] = useState<any>(initialData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className={`modal-card ${type === 'products' ? 'pro-modal-card-wide' : ''}`}>
        <header className="modal-header">
          <h3>{initialData ? 'Edit' : 'Add New'} {type.slice(0, -1)}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>
        <form onSubmit={handleSubmit} className="modal-form">
          {type === 'products' && (
            <div className="pro-modal-two-col">
              <div>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Special Croissant"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    required
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.$id} value={c.$id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  {!formData.usesRecipe && (
                    <div className="form-group">
                      <label>HPP / Cost (Rp)</label>
                      <input
                        type="number"
                        required={!formData.usesRecipe}
                        value={formData.cost || ''}
                        onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                        placeholder="8000"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Price (Rp)</label>
                    <input
                      type="number"
                      required
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="15000"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="form-group">
                  <label>Product Image</label>
                  <div className="image-upload-zone" onClick={() => document.getElementById('prod-img-input')?.click()}>
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${formData.imageUrl}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
                        className="uploaded-preview"
                        alt="Preview"
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Plus size={32} color="#94a3b8" />
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                          Click to Upload Image
                        </div>
                      </div>
                    )}
                    <input
                      id="prod-img-input"
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const resp = await storage.createFile(bucketId, 'unique()', file);
                          setFormData({ ...formData, imageUrl: resp.$id, imageFileId: resp.$id });
                        } catch (err) {
                          alert('Upload failed');
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="switch-group">
                    <div className="switch-label-wrap">
                      <label style={{ margin: 0 }}>Use HPP (Recipes)</label>
                      <span className="switch-subtext">Link to recipe for stock & cost tracking</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.usesRecipe || false}
                      onChange={(e) => setFormData({ ...formData, usesRecipe: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                  </div>
                </div>

                {formData.usesRecipe && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Link to Recipe</label>
                    <select
                      required={formData.usesRecipe}
                      value={formData.recipeId || ''}
                      onChange={(e) => setFormData({ ...formData, recipeId: e.target.value })}
                    >
                      <option value="">Select Recipe</option>
                      {recipes.map((r) => (
                        <option key={r.$id} value={r.$id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {type === 'categories' && (
            <>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pastry"
                />
              </div>
              <div className="form-group">
                <label>Brand Color</label>
                <div className="color-input-wrap">
                  <input
                    type="color"
                    value={formData.color || '#3d7066'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  <code>{formData.color || '#3d7066'}</code>
                </div>
              </div>
            </>
          )}

          {(type === 'ingredients' || type === 'recipes') && (
            <div className="modal-premium-notice">
              <Lock size={32} />
              <h4>Coming Soon to Web</h4>
              <p>Advanced Ingredients & Recipe management is currently best handled via the mobile app. We are syncronizing these detailed forms for web.</p>
            </div>
          )}

          <footer className={type === 'products' ? 'pro-modal-footer-wide' : 'modal-footer'}>
            <button type="button" className="app-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="app-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

function SaleDetailModal({ sale, items, productsById, onClose, onCancel }: any) {
  const totalHpp = items.reduce((sum: number, it: any) => sum + itemCost(it), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-card pro-modal-card-wide">
        <header className="modal-header">
          <h3>Sale Details</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="modal-content pro-modal-two-col" style={{ padding: '2rem' }}>
          <div>
            <div className="sale-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transaction ID</label>
                <div className="font-mono text-sm" style={{ color: '#64748b' }}>{sale.$id}</div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date & Time</label>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{new Date(tsOf(sale)).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</label>
                <span className={`badge-${sale.status || 'completed'}`} style={{ fontSize: '0.7rem' }}>
                  {(sale.status || 'completed').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="sale-items-list">
              <h4 style={{ marginBottom: '1rem', fontWeight: 800, color: '#1e293b' }}>Items Sold</h4>
              <div className="items-scroll-box" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '0 1rem' }}>
                {items.map((it: any) => (
                  <div key={it.$id} className="sale-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {productsById[it.productId]?.imageUrl && (
                        <img
                          src={productsById[it.productId].imageUrl.startsWith('http') ? productsById[it.productId].imageUrl : `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${productsById[it.productId].imageUrl}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
                          className="sale-item-thumb"
                          alt=""
                          style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div className="font-bold" style={{ color: '#1e293b' }}>{productsById[it.productId]?.name || 'Unknown Item'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {it.quantity} x Rp{(it.priceEach || it.price || 0).toLocaleString()}
                          {itemCost(it) > 0 && <span style={{ marginLeft: '8px', color: '#94a3b8' }}>(Cost: Rp{itemCost(it).toLocaleString()})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold" style={{ color: '#1e293b' }}>Rp{itemRevenue(it).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sale-summary-card" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="text-muted">Payment Method</span>
                <span className="font-bold" style={{ color: '#1e293b' }}>{(sale.paymentMethod || 'cash').toUpperCase()}</span>
              </div>
              {totalHpp > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="text-muted">Total Cost (HPP)</span>
                  <span className="font-bold" style={{ color: '#ef4444' }}>Rp{totalHpp.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '2px dashed #cbd5e1' }}>
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>Grand Total</span>
                <span style={{ fontWeight: 900, color: PRIMARY, fontSize: '1.5rem' }}>Rp{(sale.total || 0).toLocaleString()}</span>
              </div>
            </div>

            <footer className="modal-footer" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              {sale.status !== 'canceled' && (
                <button className="app-btn-danger" onClick={() => { onCancel(sale.$id); onClose(); }} style={{ padding: '0.75rem 1.5rem' }}>
                  Cancel Sale
                </button>
              )}
              <button className="app-btn-primary" onClick={onClose} style={{ padding: '0.75rem 2rem' }}>Close</button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export const DashboardPage = () => {
  const { planId, isPremium, clerkUserId } = useUserData();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({ userMemberships: true });
  const organizationList = userMemberships?.data ?? [];
  const [activeStoreId, setActiveStoreId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'home' | 'analytics'>('home');
  const [managementView, setManagementView] = useState<string | null>(null);

  const hasAnalyticsAccess = planId === 'premium';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [rangeStart, setRangeStart] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [rangeEnd, setRangeEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [saleHeaders, setSaleHeaders] = useState<SaleHeaderDoc[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItemDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDoc[]>([]);
  const [recipes, setRecipes] = useState<RecipeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleCreate = () => {
    setEditingItem(null);
    setShowModal(managementView);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowModal(managementView);
  };

  const handleDelete = async (id: string) => {
    if (!managementView || !confirm('Are you sure you want to delete this item?')) return;
    let colId = '';
    if (managementView === 'products') colId = productsCollectionId;
    else if (managementView === 'categories') colId = categoriesCollectionId;
    else if (managementView === 'ingredients') colId = ingredientsCollectionId;
    else if (managementView === 'recipes') colId = recipesCollectionId;

    if (!colId) return;
    try {
      await remove(colId, id);
      // Refresh local state
      if (managementView === 'products') setProducts(products.filter(p => p.$id !== id));
      else if (managementView === 'categories') setCategories(categories.filter(c => c.$id !== id));
      else if (managementView === 'ingredients') setIngredients(ingredients.filter(i => i.$id !== id));
      else if (managementView === 'recipes') setRecipes(recipes.filter(r => r.$id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleSave = async (data: any) => {
    if (!managementView) return;
    setFormLoading(true);
    let colId = '';
    if (managementView === 'products') colId = productsCollectionId;
    else if (managementView === 'categories') colId = categoriesCollectionId;
    else if (managementView === 'ingredients') colId = ingredientsCollectionId;
    else if (managementView === 'recipes') colId = recipesCollectionId;

    if (!colId) return;
    try {
      const payload = { ...data, clerkUserId, orgId: activeStoreId || null };
      if (editingItem) {
        const updated = await update<any>(colId, editingItem.$id, payload);
        if (managementView === 'products') setProducts(products.map(p => p.$id === updated.$id ? updated : p));
        else if (managementView === 'categories') setCategories(categories.map(c => c.$id === updated.$id ? updated : c));
        else if (managementView === 'ingredients') setIngredients(ingredients.map(i => i.$id === updated.$id ? updated : i));
        else if (managementView === 'recipes') setRecipes(recipes.map(r => r.$id === updated.$id ? updated : r));
      } else {
        const created = await create<any>(colId, payload);
        if (managementView === 'products') setProducts([...products, created]);
        else if (managementView === 'categories') setCategories([...categories, created]);
        else if (managementView === 'ingredients') setIngredients([...ingredients, created]);
        else if (managementView === 'recipes') setRecipes([...recipes, created]);
      }
      setShowModal(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setFormLoading(false);
    }
  };

  const [selectedSale, setSelectedSale] = useState<SaleHeaderDoc | null>(null);

  const handleCancelSale = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this sale? This action is permanent.')) return;
    try {
      await update(salesCollectionId, id, { status: 'canceled' });
      setSaleHeaders(prev => prev.map(h => h.$id === id ? { ...h, status: 'canceled' } : h));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cancel failed');
    }
  };

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
        const [headers, items, prods, cats, exps, ings, recs] = await Promise.all([
          list<SaleHeaderDoc>(salesCollectionId, [
            Query.greaterThanEqual('timestamp', new Date(startTs).toISOString()),
            Query.lessThanEqual('timestamp', new Date(endTs).toISOString()),
            ...tenant,
          ]),
          list<SaleItemDoc>(saleItemsCollectionId, [...tenant]),
          list<ProductDoc>(productsCollectionId, [...tenant]),
          list<CategoryDoc>(categoriesCollectionId, [...tenant]),
          list<ExpenseDoc>(expensesCollectionId, [...tenant]),
          isPremium ? list<IngredientDoc>(ingredientsCollectionId, [...tenant]) : Promise.resolve([]),
          isPremium ? list<RecipeDoc>(recipesCollectionId, [...tenant]) : Promise.resolve([]),
        ]);
        setSaleHeaders(headers);
        setSaleItems(items);
        setProducts(prods);
        setCategories(cats);
        setExpenses(exps);
        setIngredients(ings);
        setRecipes(recs);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activeStoreId, canQuery, rangeEnd, rangeStart, clerkUserId]);

  useEffect(() => {
    if (!canQuery || !activeStoreId) return;

    const unsubscribe = appwriteClient.subscribe(
      [`databases.${databaseId}.collections.*.documents`],
      (response) => {
        const doc = response.payload as any;
        const isOurData = doc.orgId === activeStoreId || (!doc.orgId && doc.clerkUserId === clerkUserId);
        if (!isOurData) return;

        const collectionId = response.events[0].split('.')[3];
        const eventType = response.events[0].split('.').pop();

        const handler = (prev: any[]) => {
          if (eventType === 'create') {
            return prev.some(d => d.$id === doc.$id) ? prev : [...prev, doc];
          }
          if (eventType === 'update') {
            return prev.map(d => d.$id === doc.$id ? doc : d);
          }
          if (eventType === 'delete') {
            return prev.filter(d => d.$id !== doc.$id);
          }
          return prev;
        };

        if (collectionId === productsCollectionId) setProducts(handler);
        else if (collectionId === categoriesCollectionId) setCategories(handler);
        else if (collectionId === ingredientsCollectionId) setIngredients(handler);
        else if (collectionId === recipesCollectionId) setRecipes(handler);
        else if (collectionId === salesCollectionId) setSaleHeaders(handler);
        else if (collectionId === saleItemsCollectionId) setSaleItems(handler);
        else if (collectionId === expensesCollectionId) setExpenses(handler);
      }
    );

    return () => unsubscribe();
  }, [canQuery, activeStoreId, clerkUserId]);

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
    <div className="pro-dashboard-shell">
      <aside className="pro-sidebar">
        <div className="pro-sidebar-logo">
          <img src={logoIcon} alt="Bcash" style={{ width: 32, height: 32 }} />
          <span>BCash POS</span>
        </div>

        <nav className="pro-sidebar-nav">
          <div className="nav-group" style={{ marginBottom: 24 }}>
            <span className="nav-group-title" style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, paddingLeft: 20, marginBottom: 8, display: 'block' }}>MAIN MENU</span>
            <button className={`pro-nav-item ${activeTab === 'home' && !managementView ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setManagementView(null); }}>
              <LayoutDashboard size={20} /> Dashboard
            </button>
            {hasAnalyticsAccess && (
              <button className={`pro-nav-item ${activeTab === 'analytics' && !managementView ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setManagementView(null); }}>
                <BarChart2 size={20} /> Analytics
              </button>
            )}
          </div>

          <div className="nav-group">
            <span className="nav-group-title" style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, paddingLeft: 20, marginBottom: 8, display: 'block' }}>MANAGE</span>
            <button className={`pro-nav-item ${managementView === 'products' ? 'active' : ''}`} onClick={() => setManagementView('products')}>
              <ShoppingBasket size={20} /> Products
            </button>
            <button className={`pro-nav-item ${managementView === 'categories' ? 'active' : ''}`} onClick={() => setManagementView('categories')}>
              <Tags size={20} /> Categories
            </button>
            <button className={`pro-nav-item ${managementView === 'ingredients' ? 'active' : ''}`} onClick={() => setManagementView('ingredients')}>
              <Package size={20} /> Ingredients
            </button>
            <button className={`pro-nav-item ${managementView === 'recipes' ? 'active' : ''}`} onClick={() => setManagementView('recipes')}>
              <Utensils size={20} /> Recipes
            </button>
            <button className={`pro-nav-item ${managementView === 'transactions' ? 'active' : ''}`} onClick={() => setManagementView('transactions')}>
              <History size={20} /> Transactions
            </button>
            {isPremium && (
              <button className={`pro-nav-item ${managementView === 'staff' ? 'active' : ''}`} onClick={() => setManagementView('staff')}>
                <Users size={20} /> Staff
              </button>
            )}
          </div>
        </nav>

        <div className="pro-sidebar-footer">
          {/* We hide the original pill style here entirely and rely on the new top right user profile. 
              But for now, keep something subtle if needed or just remove. */}
        </div>
      </aside>

      <main className="pro-main">
        <header className="pro-topbar">
          <div className="pro-topbar-left">
            <h1 className="pro-topbar-title">
              {managementView ? managementView.charAt(0).toUpperCase() + managementView.slice(1) : (activeTab === 'home' ? 'Dashboard' : 'Analytics')}
            </h1>
            <div className="pro-search-bar hide-mobile">
              <Search size={18} color="#94a3b8" />
              <input type="text" placeholder="Search here..." />
            </div>
          </div>

          <div className="pro-topbar-right">
            <a href="dashingbakery://" className="pro-store-pill" style={{ textDecoration: 'none' }} title="Open BCash App">
              <Smartphone size={16} color="#2563eb" /> <span className="hide-mobile">Open App</span>
            </a>
            <div className="pro-store-pill">
              <span className="org-label" style={{ color: '#94a3b8' }}>Store</span>
              <select onChange={(e) => setActiveStoreId(e.target.value)} value={activeStoreId}>
                {organizationList.map((m) => (
                  <option key={m.organization.id} value={m.organization.id}>
                    {m.organization.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pro-user-profile">
              <div className="pro-user-info hide-mobile" style={{ textAlign: 'right' }}>
                <span className="pro-user-name">Owner</span>
                <span className="pro-user-role">{planId.toUpperCase()}</span>
              </div>
              <div className="pro-avatar">
                {clerkUserId?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="pro-content">

          {error && <div className="dashboard-error-banner" style={{ marginBottom: '1.5rem' }}><AlertCircle size={16} /> {error}</div>}

          {loading && saleHeaders.length === 0 ? (
            <div className="dashboard-loading-state">Loading Store Data...</div>
          ) : (
            <>

              {managementView ? (
                <div className="pro-manage-container">
                  {managementView === 'products' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Products</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Total: {products.length} items</span>
                        </div>
                        <div className="pro-manage-actions">
                          <button className="pro-btn-primary" onClick={handleCreate} title={`Add ${managementView.slice(0, -1)}`}>
                            <Plus size={16} /> <span className="hide-mobile">Add {managementView.slice(0, -1)}</span>
                          </button>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Category</th>
                              <th align="right">HPP</th>
                              <th align="right">Price</th>
                              <th align="right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map(p => (
                              <tr key={p.$id}>
                                <td>
                                  <div className="manage-item-cell">
                                    {p.imageUrl ? (
                                      <img
                                        src={p.imageUrl.startsWith('http') ? p.imageUrl : `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${p.imageUrl}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
                                        alt=""
                                        className="product-thumb-circle"
                                      />
                                    ) : (
                                      <div className="product-thumb-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={16} color="#cbd5e1" />
                                      </div>
                                    )}
                                    <span className="manage-item-name">
                                      {p.name || 'Unnamed Product'}
                                      {p.usesRecipe && <span className="hpp-badge">HPP</span>}
                                    </span>
                                  </div>
                                </td>
                                <td>{categories.find(c => c.$id === p.categoryId)?.name || 'No Category'}</td>
                                <td align="right" className="hpp-val-cell">
                                  {p.usesRecipe ? (
                                    <span className="hpp-hint" title="Configured via Recipe">Recipe Based</span>
                                  ) : (
                                    <span>Rp{(p.cost || 0).toLocaleString()}</span>
                                  )}
                                </td>
                                <td align="right">Rp{(p.price || 0).toLocaleString()}</td>
                                <td align="right">
                                  <div className="manage-row-actions">
                                    <button className="icon-btn edit-btn" title="Edit" onClick={() => handleEdit(p)}><Edit2 size={14} /></button>
                                    <button className="icon-btn delete-btn" title="Delete" onClick={() => handleDelete(p.$id)}><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : managementView === 'categories' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Categories</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Total: {categories.length} items</span>
                        </div>
                        <div className="pro-manage-actions">
                          <button className="pro-btn-primary" onClick={handleCreate} title={`Add ${managementView.slice(0, -1)}`}>
                            <Plus size={16} /> <span className="hide-mobile">Add {managementView.slice(0, -1)}</span>
                          </button>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Items</th>
                              <th align="right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.map(c => (
                              <tr key={c.$id}>
                                <td>
                                  <div className="manage-item-cell">
                                    <div className="cat-color-pill" style={{ backgroundColor: c.color || '#3d7066' }} />
                                    <span className="manage-item-name">{c.name || 'Unnamed'}</span>
                                  </div>
                                </td>
                                <td>{products.filter(p => p.categoryId === c.$id).length} products</td>
                                <td align="right">
                                  <div className="manage-row-actions">
                                    <button className="icon-btn edit-btn" title="Edit" onClick={() => handleEdit(c)}><Edit2 size={14} /></button>
                                    <button className="icon-btn delete-btn" title="Delete" onClick={() => handleDelete(c.$id)}><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : managementView === 'transactions' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Transactions</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Total: {stats.listHeaders.length} sales</span>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Payment</th>
                              <th align="right">Total</th>
                              <th align="right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...stats.listHeaders].reverse().map(h => (
                              <tr key={h.$id} className={h.status === 'canceled' ? 'row-canceled' : ''}>
                                <td>{new Date(tsOf(h)).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                <td>{(h.status || 'completed').toUpperCase()}</td>
                                <td>{(h.paymentMethod || 'cash').toUpperCase()}</td>
                                <td>
                                  <span className={`badge-${h.status || 'completed'}`}>
                                    {(h.status || 'completed').toUpperCase()}
                                  </span>
                                </td>
                                <td align="right" className="font-bold">Rp{totalOf(h).toLocaleString()}</td>
                                <td align="right">
                                  <div className="manage-row-actions">
                                    <button className="icon-btn view-btn" title="Details" onClick={() => setSelectedSale(h)}><ChevronRight size={14} /></button>
                                    {h.status !== 'canceled' && (
                                      <button className="icon-btn cancel-btn" title="Cancel Sale" onClick={() => handleCancelSale(h.$id)}><X size={14} /></button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : managementView === 'staff' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Staff Members</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Total: {organizationList.length} members</span>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th align="right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {organizationList.map(m => (
                              <tr key={m.id}>
                                <td>
                                  <div className="manage-item-cell">
                                    {m.publicUserData?.imageUrl && (
                                      <img src={m.publicUserData.imageUrl} alt="" className="staff-avatar" />
                                    )}
                                    <span className="manage-item-name">{m.publicUserData?.firstName} {m.publicUserData?.lastName}</span>
                                  </div>
                                </td>
                                <td>{m.publicUserData?.identifier}</td>
                                <td>
                                  <span className="role-badge">{(m.role || 'member').toUpperCase()}</span>
                                </td>
                                <td align="right">
                                  <span className="status-online">ACTIVE</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ padding: 24, textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: '#64748b' }}>To add or remove staff, please use the <a href="https://clerk.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600 }}>Clerk Organization Dashboard</a></p>
                      </div>
                    </>
                  ) : (
                    <div className="pro-empty-state">
                      {(managementView === 'ingredients' || managementView === 'recipes') ? (
                        <div style={{ padding: 40, background: '#ffffff', borderRadius: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
                          <Smartphone size={64} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 24 }} />
                          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>Mobile Exclusive Feature</h3>
                          <p style={{ maxWidth: 480, margin: '0 0 32px 0', lineHeight: 1.6, color: '#64748b' }}>
                            Managing {managementView} is currently only available through our mobile application.
                            Please use the BCash app to manage your stock, cost of goods, and recipes.
                          </p>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <a href="dashingbakery://" className="pro-btn-primary" style={{ textDecoration: 'none' }}>
                              <Smartphone size={18} /> Open BCash App
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: 40, background: '#ffffff', borderRadius: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
                          <Search size={64} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 24 }} />
                          <p style={{ fontSize: 16, color: '#64748b' }}>Managing {managementView} is currently being synchronized...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeTab === 'home' ? (
                <div className="pro-home-grid">
                  <div className="pro-home-left">
                    <div className="pro-hero-card">
                      <div className="pro-hero-content">
                        <h2>Welcome to the best<br />management experience.</h2>
                        <p>Track everything from products to detailed analytics in real-time. {storeName} makes it easy.</p>
                        <button className="pro-hero-btn" onClick={() => setManagementView('products')}>Manage Products</button>
                      </div>
                      <div className="pro-hero-decor">
                        <Smartphone size={80} color="rgba(255,255,255,0.4)" strokeWidth={1} />
                      </div>
                    </div>

                    <div className="pro-card">
                      <div className="pro-card-header">
                        <h3 className="pro-card-title">Total Revenue</h3>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Today: Rp{(stats.todayRevenue / 1000).toFixed(0)}k</span>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={stats.chartData || []}>
                          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => [`Rp${Number(v).toLocaleString()}`, 'Revenue']} />
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#eff6ff" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pro-two-col">
                      <div className="pro-card">
                        <div className="pro-card-header">
                          <h3 className="pro-card-title">Status</h3>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>Payment Types</span>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={stats.paymentData} innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                              {stats.paymentData.map((_, index) => <Cell key={index} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => `Rp${Number(v).toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#10b981', fontSize: 10, fontWeight: 700 }}>● CASH</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{stats.paymentData.find(x => x.name.toLowerCase() === 'cash')?.value ? Math.round((stats.paymentData.find(x => x.name.toLowerCase() === 'cash')!.value / Math.max(stats.revenue, 1)) * 100) : 0}%</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>● QRIS</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{stats.paymentData.find(x => x.name.toLowerCase() === 'qris')?.value ? Math.round((stats.paymentData.find(x => x.name.toLowerCase() === 'qris')!.value / Math.max(stats.revenue, 1)) * 100) : 0}%</div>
                          </div>
                        </div>
                      </div>
                      <div className="pro-card">
                        <div className="pro-card-header">
                          <h3 className="pro-card-title">Store Data</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>Total Products</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{products.length}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>Categories</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{categories.length}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>Today's Sales</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{stats.todaySalesCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pro-home-right">
                    <div className="pro-card">
                      <div className="pro-card-header">
                        <h3 className="pro-card-title">Recent TX</h3>
                        <span style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }} onClick={() => setManagementView('transactions')}>View all</span>
                      </div>
                      <div className="pro-message-list">
                        {[...stats.listHeaders].reverse().slice(0, 5).map((h: SaleHeaderDoc) => (
                          <div className="pro-msg-item" key={h.$id}>
                            <div className="pro-msg-avatar" style={{ backgroundColor: pmOf(h) === 'cash' ? '#d1fae5' : '#dbeafe', color: pmOf(h) === 'cash' ? SUCCESS : PRIMARY }}>
                              {pmOf(h) === 'cash' ? <Banknote size={20} /> : pmOf(h) === 'qris' ? <Smartphone size={20} /> : <CreditCard size={20} />}
                            </div>
                            <div className="pro-msg-info">
                              <div className="pro-msg-name">{pmOf(h).toUpperCase()}</div>
                              <div className="pro-msg-text">{new Date(tsOf(h)).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              Rp{totalOf(h).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {stats.listHeaders.length === 0 && (
                          <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No recent transactions</div>
                        )}
                      </div>
                      <button className="pro-msg-btn" onClick={() => setManagementView('transactions')}>View all transactions</button>
                    </div>

                    <div className="pro-card">
                      <div className="pro-card-header">
                        <h3 className="pro-card-title">All Listing</h3>
                      </div>
                      <div className="pro-listing-grid">
                        {products.filter(p => !!p.imageUrl).slice(0, 9).map(match => {
                          return (
                            <div className="pro-listing-item" key={match.$id}>
                              <img src={match.imageUrl!.startsWith('http') ? match.imageUrl : `https://cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${match.imageUrl}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`} alt={match.name} />
                            </div>
                          );
                        })}
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

          {showModal && (
            <ManagementModal
              type={showModal}
              onClose={() => setShowModal(null)}
              onSave={handleSave}
              initialData={editingItem}
              categories={categories}
              recipes={recipes}
              loading={formLoading}
            />
          )}

          {selectedSale && (
            <SaleDetailModal
              sale={selectedSale}
              items={saleItems.filter(it => it.saleId === selectedSale.$id)}
              productsById={productsById}
              onClose={() => setSelectedSale(null)}
              onCancel={handleCancelSale}
            />
          )}
        </div>
      </main>
    </div>
  );
};
