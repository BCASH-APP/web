import { useEffect, useMemo, useState } from 'react';
import { useOrganizationList, useUser, UserButton } from '@clerk/react';
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
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Banknote,
  BarChart2,
  ChevronRight,
  ClipboardList,
  Edit2,
  History,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingBasket,
  Smartphone,
  Tags,
  Trash2,
  TrendingUp,
  Users,
  Utensils,
  X,
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
  recipeLinesCollectionId,
  stockAdjustmentsCollectionId,
  bucketId,
  storage,
  appwriteClient,
  databaseId,
} from '../lib/appwrite';
import { create, list, remove, tenantQueries, update } from '../lib/repo';
import { useUserData } from '../lib/useUserData';

const PRIMARY = '#3d7066';
const SUCCESS = '#22C55E';
const MUTED = '#8a9e9a';

type SaleHeaderDoc = {
  $id: string;
  $createdAt: string;
  $updatedAt?: string;
  timestamp?: string;
  paymentMethod?: string;
  total?: number;
  status?: string;
  orgId?: string | null;
  clerkUserId?: string;
  itemCount?: number;
};

type SaleItemDoc = {
  $id: string;
  $updatedAt?: string;
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
  $updatedAt?: string;
  name?: string;
  category?: string;
  price?: number;
  cost?: number;
  imageUrl?: string;
  imageFileId?: string;
  usesRecipe?: boolean;
  recipeId?: string;
  categoryName?: string;
  categoryColor?: string;
};
type CategoryDoc = { $id: string; $updatedAt?: string; name?: string; color?: string };
type ExpenseDoc = { $id: string; $updatedAt?: string; type?: string; amount?: number; description?: string; timestamp?: string; $createdAt?: string; ingredientName?: string };
type IngredientDoc = {
  $id: string;
  $updatedAt?: string;
  name?: string;
  unitType?: string;
  baseUnit?: string;
  costPerUnit?: number;
  stockQtyBase?: number;
  minStockThreshold?: number;
  purchaseUnit?: string;
  purchaseQuantity?: number;
  purchasePrice?: number;
};
type RecipeDoc = {
  $id: string;
  $updatedAt?: string;
  name?: string;
  yield?: number;
  overheadPercent?: number;
};
type RecipeLineDoc = {
  $id: string;
  $updatedAt?: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit?: string;
};
type StockAdjustmentDoc = {
  $id: string;
  $updatedAt?: string;
  ingredientId: string;
  deltaBase: number;
  reason?: string;
  timestamp: string;
  $createdAt: string;
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
  allProducts: ProductDoc[];
  loading: boolean;
  getRecipeCost: (recipeId: string) => number;
};

const ManagementModal: React.FC<ModalProps> = ({ type, onClose, onSave, initialData, categories, recipes, allProducts, loading, getRecipeCost }) => {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [showGallery, setShowGallery] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSave(formData);
  };

  const galleryImages = Array.from(new Set(allProducts.map(p => p.imageUrl).filter(Boolean)));

  return (
    <div className="modal-overlay">
      <div className={`modal-card ${type === 'products' ? 'pro-modal-card-wide' : ''}`}>
        <header className="modal-header">
          <h3>{initialData ? 'Edit' : 'Add New'} {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1, -1)}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        {showGallery ? (
          <div className="gallery-view">
            <div className="gallery-header">
              <h4>Cloud Gallery</h4>
              <button className="pro-btn-subtle" onClick={() => setShowGallery(false)}>Back to Form</button>
            </div>
            <div className="gallery-grid">
              {galleryImages.map((img: any, idx) => (
                <div key={idx} className="gallery-item" onClick={() => { setFormData({ ...formData, imageUrl: img }); setShowGallery(false); }}>
                  <img src={img.startsWith('http') ? img : `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${img}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`} alt="" />
                </div>
              ))}
              {galleryImages.length === 0 && <p className="text-center text-muted">No images in gallery yet</p>}
            </div>
          </div>
        ) : (
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
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.$id} value={c.$id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
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
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Product Image
                      <span className="gallery-trigger" onClick={() => setShowGallery(true)}>Open Gallery</span>
                    </label>
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
                    <>
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

                      {formData.recipeId && (
                        <div className="hpp-preview" style={{ 
                          marginTop: '1rem', 
                          backgroundColor: '#f8fafc', 
                          padding: '1rem', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>HPP Price =</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1e293b' }}>
                              Rp{getRecipeCost(formData.recipeId).toLocaleString('id-ID')}
                            </span>
                          </div>
                          {formData.price && parseFloat(formData.price) > 0 && (() => {
                            const hpp = getRecipeCost(formData.recipeId);
                            const price = parseFloat(formData.price);
                            const profit = price - hpp;
                            const margin = price > 0 ? (profit / price) * 100 : 0;
                            return (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Profit =</span>
                                <span style={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: '700', 
                                  color: margin >= 30 ? '#22C55E' : '#f59e0b' 
                                }}>
                                  Rp{profit.toLocaleString('id-ID')} ({margin.toFixed(1)}%)
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
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

            {type === 'expenses' && (
              <>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    required
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Electricity bill"
                  />
                </div>
                <div className="form-group">
                  <label>Amount (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="50000"
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={formData.timestamp ? new Date(formData.timestamp).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setFormData({ ...formData, timestamp: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </>
            )}

            {(type === 'ingredients' || type === 'recipes' || type === 'stock_changes') && (
              <div className="modal-premium-notice">
                <Smartphone size={48} />
                <h4>Display Only on Web</h4>
                <p>Detailed management for {type.replace('_', ' ')} is best handled via the mobile app for real-time inventory precision.</p>
              </div>
            )}

            <footer className={(type === 'products' || type === 'expenses') ? 'pro-modal-footer-wide' : 'modal-footer'}>
              <button type="button" className="app-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
              {(type === 'products' || type === 'categories' || type === 'expenses') && (
                <button type="submit" className="app-btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </footer>
          </form>
        )}
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
  const { user } = useUser();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({ userMemberships: true });
  const organizationList = userMemberships?.data ?? [];
  const [activeStoreId, setActiveStoreId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'home' | 'analytics'>('home');
  const [managementView, setManagementView] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasAnalyticsAccess = planId === 'premium';

  const statusFilter = 'all';
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
  const [recipeLines, setRecipeLines] = useState<RecipeLineDoc[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustmentDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingRecipe, setViewingRecipe] = useState<RecipeDoc | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // HPP Calculation Function
  const getRecipeCost = (recipeId: string): number => {
    if (!recipeId || !recipes || !recipeLines || !ingredients) return 0;
    
    const recipe = recipes.find((r: RecipeDoc) => r.$id === recipeId);
    if (!recipe) return 0;

    const lines = recipeLines.filter((rl: RecipeLineDoc) => rl.recipeId === recipeId);
    if (!lines || lines.length === 0) return 0;

    const materialCost = lines.reduce((acc, line) => {
      if (!line || !line.ingredientId) return acc;
      
      const ingredient = ingredients.find((ing: IngredientDoc) => ing.$id === line.ingredientId);
      if (!ingredient || !ingredient.costPerUnit) return acc;
      
      // Calculate based on saved base quantities (like mobile)
      // Mobile app saves line quantity in the unit selected, but we need cost per base unit
      // Actually mobile app getRecipeCost: qtyBase = isSameType ? toBase(line.quantity, line.unit) : toBase(line.quantity, ing.baseUnit as any);
      // Here in web, we'll assume line.quantity is already in base unit (g/ml/pcs) or handle it simply
      const baseQty = line.quantity || 0;
      const unitCost = ingredient.costPerUnit || 0;
      return acc + (baseQty * unitCost);
    }, 0);

    const yieldQty = Math.max(recipe.yield || 1, 1);
    const overheadMultiplier = 1 + (recipe.overheadPercent || 0) / 100;

    return (materialCost * overheadMultiplier) / yieldQty;
  };

  const getIngredientDisplay = (ing: IngredientDoc) => {
    const pu = (ing.purchaseUnit || (ing.baseUnit === 'g' ? 'kg' : ing.baseUnit === 'ml' ? 'liter' : ing.baseUnit)) as string;
    const isBig = pu === 'kg' || pu === 'liter';
    const displayQty = isBig ? (ing.stockQtyBase || 0) / 1000 : (ing.stockQtyBase || 0);
    const mul = isBig ? 1000 : 1;
    const displayCost = (ing.costPerUnit || 0) * mul;
    return { pu, displayQty, displayCost };
  };

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
    else if (managementView === 'expenses') colId = expensesCollectionId;

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
    else if (managementView === 'expenses') colId = expensesCollectionId;

    if (!colId) return;
    try {
      // Clean data of system fields before saving
      const cleanData = { ...data };
      delete cleanData.$id;
      delete cleanData.$createdAt;
      delete cleanData.$updatedAt;
      delete cleanData.$collectionId;
      delete cleanData.$databaseId;
      delete cleanData.$permissions;

      const payload = { 
        ...cleanData, 
        clerkUserId, 
        orgId: activeStoreId || null,
        // Add required 'type' for expenses if missing
        ...(managementView === 'expenses' ? { type: cleanData.type || 'custom' } : {}),
      };

      if (editingItem) {
        const updated = await update<any>(colId, editingItem.$id, payload);
        if (managementView === 'products') setProducts(products.map(p => p.$id === updated.$id ? updated : p));
        else if (managementView === 'categories') setCategories(categories.map(c => c.$id === updated.$id ? updated : c));
        else if (managementView === 'ingredients') setIngredients(ingredients.map(i => i.$id === updated.$id ? updated : i));
        else if (managementView === 'recipes') setRecipes(recipes.map(r => r.$id === updated.$id ? updated : r));
        else if (managementView === 'expenses') setExpenses(expenses.map(e => e.$id === updated.$id ? updated : e));
      } else {
        const created = await create<any>(colId, payload);
        if (managementView === 'products') setProducts([...products, created]);
        else if (managementView === 'categories') setCategories([...categories, created]);
        else if (managementView === 'ingredients') setIngredients([...ingredients, created]);
        else if (managementView === 'recipes') setRecipes([...recipes, created]);
        else if (managementView === 'expenses') setExpenses([...expenses, created]);
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
      const now = new Date().toISOString();
      const sale = saleHeaders.find(h => h.$id === id);
      if (!sale) return;

      // 1. Update Sale Header Status
      await update(salesCollectionId, id, { 
        status: 'canceled',
        timestamp: now // Use timestamp for sync
      });
      setSaleHeaders(prev => prev.map(h => h.$id === id ? { ...h, status: 'canceled', timestamp: now } : h));

      // 2. Stock Restoration Logic (Mirroring mobile's granular traceability)
      if (isPremium) {
        const items = saleItems.filter(it => it.saleId === id);
        
        // Group by ingredient to update stock ONCE per ingredient (avoid race conditions)
        const ingredientUpdates: Record<string, { ingredient: IngredientDoc, totalDelta: number, productRestorations: Array<{ pName: string, delta: number }> }> = {};

        for (const it of items) {
          const p = products.find(prod => prod.$id === it.productId);
          if (!p || !p.usesRecipe || !p.recipeId) continue;

          const r = recipes.find(rec => rec.$id === p.recipeId);
          const lines = recipeLines.filter(rl => rl.recipeId === p.recipeId);
          const batchYield = Math.max(r?.yield || 1, 1);

          for (const line of lines) {
            const ing = ingredients.find(ingred => ingred.$id === line.ingredientId);
            if (!ing) continue;

            const restoration = (line.quantity / batchYield) * it.quantity;
            
            if (!ingredientUpdates[ing.$id]) {
              ingredientUpdates[ing.$id] = { ingredient: ing, totalDelta: 0, productRestorations: [] };
            }
            ingredientUpdates[ing.$id].totalDelta += restoration;
            ingredientUpdates[ing.$id].productRestorations.push({ pName: p.name || 'Unknown', delta: restoration });
          }
        }

        // Apply updates
        for (const ingId in ingredientUpdates) {
          const { ingredient, totalDelta, productRestorations } = ingredientUpdates[ingId];
          const newQty = (ingredient.stockQtyBase || 0) + totalDelta;

          // Update Ingredient Stock once
          await update(ingredientsCollectionId, ingredient.$id, { stockQtyBase: newQty });
          setIngredients(prev => prev.map(i => i.$id === ingredient.$id ? { ...i, stockQtyBase: newQty } : i));

          // Create individual adjustment records for each product's contribution
          for (const pr of productRestorations) {
            const adjDoc = await create<StockAdjustmentDoc>(stockAdjustmentsCollectionId, {
              ingredientId: ingredient.$id,
              deltaBase: pr.delta,
              reason: `Cancel Sale: ${id} | Product: ${pr.pName}`,
              clerkUserId,
              orgId: activeStoreId || null,
              timestamp: now
            });
            setStockAdjustments(prev => [...prev, adjDoc]);
          }
        }
      }

      alert('Transaction canceled and stock restored.');
    } catch (e) {
      console.error('Cancel sale error:', e);
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
        const [headers, items, prods, cats, exps, ings, recs, recipeLs, stocks] = await Promise.all([
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
          isPremium ? list<RecipeLineDoc>(recipeLinesCollectionId, [...tenant]) : Promise.resolve([]),
          isPremium ? list<StockAdjustmentDoc>(stockAdjustmentsCollectionId, [...tenant]) : Promise.resolve([]),
        ]);
        setSaleHeaders(headers);
        setSaleItems(items);
        setProducts(prods);
        setCategories(cats);
        setExpenses(exps);
        setIngredients(ings);
        setRecipes(recs);
        setRecipeLines(recipeLs);
        setStockAdjustments(stocks);
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

        if (collectionId === productsCollectionId) setProducts(prev => handler(prev));
        else if (collectionId === categoriesCollectionId) setCategories(prev => handler(prev));
        else if (collectionId === ingredientsCollectionId) setIngredients(prev => handler(prev));
        else if (collectionId === recipesCollectionId) setRecipes(prev => handler(prev));
        else if (collectionId === recipeLinesCollectionId) setRecipeLines(prev => handler(prev));
        else if (collectionId === salesCollectionId) setSaleHeaders(prev => handler(prev));
        else if (collectionId === saleItemsCollectionId) setSaleItems(prev => handler(prev));
        else if (collectionId === expensesCollectionId) setExpenses(prev => handler(prev));
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

    let filteredForStats = completedOnly;
    if (paymentFilter !== 'all') {
      filteredForStats = completedOnly.filter(h => pmOf(h) === paymentFilter);
    }

    filteredForStats.forEach((h) => {
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
        const catId = productsById[pid]?.category;
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
    const avgTicket = filteredForStats.length > 0 ? revenue / filteredForStats.length : 0;
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


    return {
      revenue,
      todayRevenue,
      todaySalesCount,
      cost,
      grossProfit,
      totalExpenses: periodExpenses,
      netProfit,
      margin,
      transactionCount: filteredForStats.length,
      canceledCount,
      itemsSold,
      avgTicket,
      bestSelling,
      categoryData,
      chartData,
      hourlyData,
      topHours,
      paymentData,
      listHeaders: paymentFilter === 'all' ? inRange : inRange.filter(h => pmOf(h) === paymentFilter),
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
      {sidebarOpen && <div className="pro-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`pro-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="pro-sidebar-logo">
          <img src={logoIcon} alt="Bcash" style={{ width: 32, height: 32 }} />
          <span>BCash POS</span>
        </div>

        <div className="pro-sidebar-store-selector show-mobile">
          <span className="pro-sidebar-label">SWITCH STORE</span>
          <div className="pro-sidebar-select-wrap">
            <Smartphone size={16} />
            <select onChange={(e) => setActiveStoreId(e.target.value)} value={activeStoreId}>
              {organizationList.map((m) => (
                <option key={m.organization.id} value={m.organization.id}>
                  {m.organization.name}
                </option>
              ))}
            </select>
          </div>
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
            <button className={`pro-nav-item ${managementView === 'transactions' ? 'active' : ''}`} onClick={() => setManagementView('transactions')}>
              <History size={20} /> Transactions
            </button>
            {isPremium && (
              <>
                <button className={`pro-nav-item ${managementView === 'ingredients' ? 'active' : ''}`} onClick={() => setManagementView('ingredients')}>
                  <Package size={20} /> Ingredients
                </button>
                <button className={`pro-nav-item ${managementView === 'recipes' ? 'active' : ''}`} onClick={() => setManagementView('recipes')}>
                  <Utensils size={20} /> Recipes
                </button>
                <button className={`pro-nav-item ${managementView === 'expenses' ? 'active' : ''}`} onClick={() => setManagementView('expenses')}>
                  <Receipt size={20} /> Expenses
                </button>
                <button className={`pro-nav-item ${managementView === 'stock_changes' ? 'active' : ''}`} onClick={() => setManagementView('stock_changes')}>
                  <ClipboardList size={20} /> Stock Changes
                </button>
                <button className={`pro-nav-item ${managementView === 'staff' ? 'active' : ''}`} onClick={() => setManagementView('staff')}>
                  <Users size={20} /> Staff
                </button>
              </>
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
            <button className="pro-mobile-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="pro-topbar-title">
              {managementView ? managementView.charAt(0).toUpperCase() + managementView.slice(1) : (activeTab === 'home' ? 'Dashboard' : 'Analytics')}
            </h1>
            <div className="pro-search-bar hide-mobile">
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search name, ID, or more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="pro-topbar-right">
            <a href="dashingbakery://" className="pro-store-pill hide-mobile" style={{ textDecoration: 'none' }} title="Open BCash App">
              <Smartphone size={16} color="#3d7066" /> <span>Open App</span>
            </a>
            <div className="pro-store-pill hide-mobile">
              <span className="org-label" style={{ color: '#94a3b8' }}>Store</span>
              <select onChange={(e) => setActiveStoreId(e.target.value)} value={activeStoreId} style={{ background: 'transparent', border: 'none', fontWeight: 700, color: 'var(--pro-text-main)', fontSize: 13, cursor: 'pointer' }}>
                {organizationList.map((m) => (
                  <option key={m.organization.id} value={m.organization.id}>
                    {m.organization.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pro-user-profile">
              <div className="pro-user-info hide-mobile" style={{ textAlign: 'right' }}>
                <span className="pro-user-name">{user?.firstName || 'Owner'}</span>
                <span className="pro-user-role">{planId.toUpperCase()}</span>
              </div>
              <div style={{ paddingLeft: '8px' }}>
                <UserButton />
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
                              <th align="right">Cost/Margin</th>
                              <th align="right">Price</th>
                              <th align="right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products
                              .filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.$id.includes(searchQuery))
                              .map(p => (
                                <tr key={p.$id}>
                                  <td data-label="Name">
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
                                        {p.$updatedAt && (
                                          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>
                                            Synced: {new Date(p.$updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                          {p.usesRecipe && <span className="hpp-badge">RECIPE</span>}
                                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                                            HPP: Rp{p.usesRecipe && p.recipeId ? getRecipeCost(p.recipeId).toLocaleString('id-ID') : (p.cost || 0).toLocaleString('id-ID')}
                                          </span>
                                        </div>
                                      </span>
                                    </div>
                                  </td>
                                  <td data-label="Category">{categories.find(c => c.$id === p.category)?.name || 'No Category'}</td>
                                  <td data-label="Margin" align="right" className="hpp-val-cell">
                                    <div className="pro-progress-container" style={{ marginLeft: 'auto' }}>
                                      {(() => {
                                        const hpp = p.usesRecipe && p.recipeId ? getRecipeCost(p.recipeId) : (p.cost || 0);
                                        const price = p.price || 0;
                                        const marginPercent = price > 0 ? Math.max(0, ((price - hpp) / price) * 100) : 0;
                                        const costPercent = 100 - marginPercent;
                                        return (
                                          <>
                                            <div className="pro-progress-labels">
                                              <span className="pro-progress-label">Margin {Math.round(marginPercent)}%</span>
                                              <span className="pro-progress-label" style={{ color: '#10b981' }}>Rp{(price - hpp).toLocaleString()}</span>
                                            </div>
                                            <div className="pro-progress-bar">
                                              <div className="pro-progress-fill" style={{ width: `${costPercent}%`, backgroundColor: '#e2e8f0' }} />
                                              <div className="pro-progress-fill" style={{ width: `${marginPercent}%`, backgroundColor: '#10b981' }} />
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td data-label="Price" align="right">Rp{(p.price || 0).toLocaleString()}</td>
                                  <td data-label="Actions" align="right">
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
                              <th>Items / Distribution</th>
                              <th align="right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories
                              .filter(c => !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map(c => (
                                <tr key={c.$id}>
                                  <td data-label="Name">
                                    <div className="manage-item-cell">
                                      <div className="cat-color-pill" style={{ backgroundColor: c.color || '#3d7066' }} />
                                      <span className="manage-item-name">
                                        {c.name || 'Unnamed'}
                                        {c.$updatedAt && (
                                          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>
                                            Synced: {new Date(c.$updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                        )}
                                      </span>
                                    </div>
                                  </td>
                                  <td data-label="Distribution">
                                    {(() => {
                                      const itemCount = products.filter(p => p.category === c.$id).length;
                                      const totalItems = Math.max(products.length, 1);
                                      const share = (itemCount / totalItems) * 100;
                                      return (
                                        <div className="pro-progress-container">
                                          <div className="pro-progress-labels">
                                            <span className="pro-progress-label">{itemCount} items</span>
                                            <span className="pro-progress-label">{Math.round(share)}%</span>
                                          </div>
                                          <div className="pro-progress-bar">
                                            <div className="pro-progress-fill" style={{ width: `${share}%`, backgroundColor: c.color || '#3d7066' }} />
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td data-label="Actions" align="right">
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
                            {[...stats.listHeaders]
                              .reverse()
                              .filter(h => !searchQuery || h.$id.includes(searchQuery) || pmOf(h).includes(searchQuery.toLowerCase()) || h.status?.includes(searchQuery.toLowerCase()))
                              .map(h => (
                                <tr key={h.$id} className={h.status === 'canceled' ? 'row-canceled' : ''}>
                                  <td data-label="Date">{new Date(tsOf(h)).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                  <td data-label="Status">
                                    <span className={`badge-${h.status || 'completed'}`}>
                                      {(h.status || 'completed').toUpperCase()}
                                    </span>
                                  </td>
                                  <td data-label="Payment">{(h.paymentMethod || 'cash').toUpperCase()}</td>
                                  <td data-label="Total" align="right">
                                    <div className="pro-progress-container" style={{ marginLeft: 'auto' }}>
                                      {(() => {
                                        const maxSale = Math.max(...stats.listHeaders.map(totalOf), 1);
                                        const currentTotal = totalOf(h);
                                        const share = (currentTotal / maxSale) * 100;
                                        return (
                                          <>
                                            <div className="pro-progress-labels">
                                              <span className="pro-progress-label">Rp{currentTotal.toLocaleString()}</span>
                                              <span className="pro-progress-label">{Math.round(share)}%</span>
                                            </div>
                                            <div className="pro-progress-bar">
                                              <div className="pro-progress-fill" style={{ width: `${share}%`, backgroundColor: h.status === 'canceled' ? '#fca5a5' : '#3d7066' }} />
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td data-label="Actions" align="right">
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
                                <td data-label="Name">
                                  <div className="manage-item-cell">
                                    {m.publicUserData?.imageUrl && (
                                      <img src={m.publicUserData.imageUrl} alt="" className="staff-avatar" />
                                    )}
                                    <span className="manage-item-name">{m.publicUserData?.firstName} {m.publicUserData?.lastName}</span>
                                  </div>
                                </td>
                                <td data-label="Email">{m.publicUserData?.identifier}</td>
                                <td data-label="Role">
                                  <span className="role-badge">{(m.role || 'member').toUpperCase()}</span>
                                </td>
                                <td data-label="Status" align="right">
                                  <span className="status-online">ACTIVE</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ padding: 24, textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: '#64748b' }}>Please manage staff members and permissions via the <span style={{ color: '#3d7066', fontWeight: 700 }}>Mobile Application</span>.</p>
                      </div>
                    </>
                  ) : managementView === 'ingredients' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Ingredients</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Stock & Raw Materials</span>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Material</th>
                              <th>Stock</th>
                              <th align="right">Cost/Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ingredients.map(ing => {
                              const { pu, displayQty, displayCost } = getIngredientDisplay(ing);
                              const isLow = (ing.stockQtyBase || 0) <= (ing.minStockThreshold || 0);
                              return (
                                <tr key={ing.$id}>
                                  <td data-label="Material">
                                    <div className="manage-item-cell">
                                      <Package size={16} color="#64748b" />
                                      <span className="manage-item-name">{ing.name}</span>
                                    </div>
                                  </td>
                                  <td data-label="Stock">
                                    <div className="pro-progress-container">
                                      <div className="pro-progress-labels">
                                        <span className="pro-progress-label" style={{ color: isLow ? '#ef4444' : '#1e293b' }}>
                                          {displayQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {pu}
                                        </span>
                                        {ing.minStockThreshold && <span className="pro-progress-label">Min {ing.minStockThreshold / (pu === 'kg' || pu === 'liter' ? 1000 : 1)} {pu}</span>}
                                      </div>
                                        {ing.minStockThreshold ? (
                                          <div className="pro-progress-bar">
                                            <div 
                                              className="pro-progress-fill" 
                                              style={{ 
                                                width: `${Math.min(((ing.stockQtyBase || 0) / (ing.minStockThreshold * 2)) * 100, 100)}%`, 
                                                backgroundColor: isLow ? '#ef4444' : '#10b981' 
                                              }} 
                                            />
                                          </div>
                                        ) : null}
                                      </div>
                                    </td>
                                  <td data-label="Cost" align="right">
                                    <div style={{ fontWeight: 600 }}>Rp{displayCost.toLocaleString()}</div>
                                    <div style={{ fontSize: 10, color: '#64748b' }}>per {pu}</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : managementView === 'recipes' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Recipes</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Production Guides</span>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Recipe Name</th>
                              <th>Units</th>
                              <th>Overhead</th>
                              <th align="right">HPP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipes.map(rec => {
                              const costPerYield = getRecipeCost(rec.$id);
                              return (
                                <tr key={rec.$id} onClick={() => setViewingRecipe(rec)} style={{ cursor: 'pointer' }}>
                                  <td data-label="Recipe Name">
                                    <div className="manage-item-cell">
                                      <Utensils size={16} color="#64748b" />
                                      <span className="manage-item-name">{rec.name}</span>
                                    </div>
                                  </td>
                                  <td data-label="Yield">{rec.yield}</td>
                                  <td data-label="Overhead">
                                    <div className="pro-progress-container">
                                      {(() => {
                                        const costPerYield = getRecipeCost(rec.$id);
                                        const overheadPercent = rec.overheadPercent || 0;
                                        return (
                                          <>
                                            <div className="pro-progress-labels">
                                              <span className="pro-progress-label">{overheadPercent}% OH</span>
                                              <span className="pro-progress-label">Rp{(costPerYield * (overheadPercent / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="pro-progress-bar">
                                              <div className="pro-progress-fill" style={{ width: `${100 - overheadPercent}%`, backgroundColor: '#e2e8f0' }} />
                                              <div className="pro-progress-fill" style={{ width: `${overheadPercent}%`, backgroundColor: '#f59e0b' }} />
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td data-label="Production Cost" align="right">
                                    <div style={{ fontWeight: 700, color: '#10b981' }}>
                                      Rp{costPerYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : managementView === 'expenses' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Expenses</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Total: Rp{stats.totalExpenses.toLocaleString()}</span>
                        </div>
                        <div className="pro-manage-actions">
                          <button className="pro-btn-primary" onClick={handleCreate}>
                            <Plus size={16} /> <span className="hide-mobile">Add Expense</span>
                          </button>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Date</th>
                              <th align="right">Amount</th>
                              <th align="right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...expenses]
                              .sort((a, b) => tsOf(b as any) - tsOf(a as any))
                              .filter(exp => !searchQuery || exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) || exp.$id.includes(searchQuery))
                              .map(exp => (
                                <tr key={exp.$id}>
                                  <td data-label="Description">
                                    <div className="manage-item-cell">
                                      {exp.type === 'stock' ? <Package size={16} color="#10b981" /> : <Receipt size={16} color="#f59e0b" />}
                                      <span className="manage-item-name">{exp.description || (exp.type === 'stock' ? exp.ingredientName : 'Custom Expense')}</span>
                                    </div>
                                  </td>
                                  <td data-label="Date">{new Date(tsOf(exp as any)).toLocaleDateString()}</td>
                                  <td data-label="Amount" align="right">
                                    <div className="pro-progress-container" style={{ marginLeft: 'auto' }}>
                                      {(() => {
                                        const totalExp = Math.max(stats.totalExpenses, 1);
                                        const share = ((exp.amount || 0) / totalExp) * 100;
                                        return (
                                          <>
                                            <div className="pro-progress-labels">
                                              <span className="pro-progress-label">Rp{exp.amount?.toLocaleString()}</span>
                                              <span className="pro-progress-label">{Math.round(share)}%</span>
                                            </div>
                                            <div className="pro-progress-bar">
                                              <div className="pro-progress-fill" style={{ width: `${share}%`, backgroundColor: '#ef4444' }} />
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td data-label="Actions" align="right">
                                    <div className="manage-row-actions">
                                      <button className="icon-btn edit-btn" onClick={() => handleEdit(exp)}><Edit2 size={14} /></button>
                                      <button className="icon-btn delete-btn" onClick={() => handleDelete(exp.$id)}><Trash2 size={14} /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : managementView === 'stock_changes' ? (
                    <>
                      <div className="pro-manage-header">
                        <div>
                          <h2 className="pro-manage-title">Stock History</h2>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Inventory Movement</span>
                        </div>
                      </div>
                      <div className="pro-table-scroll">
                        <table className="pro-table">
                          <thead>
                            <tr>
                              <th>Ingredient</th>
                              <th>Change</th>
                              <th>Reason</th>
                              <th align="right">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...stockAdjustments].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100).map(st => {
                              const ingred = ingredients.find(i => i.$id === st.ingredientId);
                              const isPositive = st.deltaBase > 0;
                              return (
                                <tr key={st.$id}>
                                  <td data-label="Ingredient">
                                    <div className="manage-item-cell">
                                      <div style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
                                        {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                      </div>
                                      <span className="manage-item-name">{ingred?.name || 'Loading...'}</span>
                                    </div>
                                  </td>
                                  <td data-label="Change">
                                    <span style={{ fontWeight: 800, color: isPositive ? '#10b981' : '#ef4444' }}>
                                      {isPositive ? '+' : ''}{st.deltaBase} {ingred?.baseUnit}
                                    </span>
                                  </td>
                                  <td data-label="Reason"><span className="text-muted" style={{ fontSize: '12px' }}>{st.reason || 'Correction'}</span></td>
                                  <td data-label="Date" align="right">{new Date(st.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
                    <div className="pro-card" style={{ background: 'var(--pro-primary)', color: 'white', borderRadius: '32px', padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ position: 'absolute', top: '-60px', left: '-20px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>TODAY REVENUE</span>
                          <h2 style={{ fontSize: '42px', fontWeight: 900, margin: '8px 0 0 0' }}>Rp{stats.todayRevenue.toLocaleString()}</h2>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8 }}>{storeName}</span>
                      </div>

                      <div style={{ position: 'relative', display: 'flex', gap: '32px', background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '24px', marginTop: '20px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Transactions</span>
                          <span style={{ fontSize: '20px', fontWeight: 800 }}>{stats.todaySalesCount}</span>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Total Period</span>
                          <span style={{ fontSize: '20px', fontWeight: 800 }}>Rp{(stats.revenue / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </div>

                    <div className="pro-card">
                      <div className="pro-card-header">
                        <h3 className="pro-card-title">Revenue Trend</h3>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Sales Performance</span>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={stats.chartData || []}>
                          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => [`Rp${Number(v).toLocaleString()}`, 'Revenue']} />
                          <Area type="monotone" dataKey="value" stroke="var(--pro-primary)" fill="rgba(61, 112, 102, 0.05)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pro-card" style={{ marginBottom: '24px' }}>
                      <div className="pro-card-header">
                        <h3 className="pro-card-title">Busiest Store Hours</h3>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Peak Performance</span>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={stats.topHours}>
                          <XAxis dataKey="name" stroke={MUTED} fontSize={11} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => [`Rp${Number(v).toLocaleString()}`, 'Sales']} cursor={{ fill: '#f1f5f9' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {stats.topHours.map((_, index) => {
                              let c = '#94a3b8';
                              if (index === 0) c = '#10b981';
                              else if (index === 1) c = '#facc15';
                              else if (index === 2) c = '#f97316';
                              else if (index === 3) c = '#ef4444';
                              return <Cell key={`cell-dash-${index}`} fill={c} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pro-card">
                      <div className="pro-card-header">
                        <h3 className="pro-card-title">Store Data</h3>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Business Snapshot</span>
                      </div>
                      <div className="store-data-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                          <Package size={18} color="var(--pro-primary)" />
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>Products</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>{products.length}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                          <Tags size={18} color="#facc15" />
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>Categories</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>{categories.length}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                          <ArrowLeftRight size={18} color="#10b981" />
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>Sales</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>{stats.todaySalesCount}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                          <Receipt size={18} color="#ef4444" />
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>Expenses</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>Rp{(stats.totalExpenses / 1000).toFixed(0)}k</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pro-home-right">
                    <div className="pro-card">
                      <div className="pro-card-header">
                        <h3 className="pro-card-title">Recent TX</h3>
                        <span style={{ fontSize: 12, color: '#3d7066', cursor: 'pointer', fontWeight: 600 }} onClick={() => setManagementView('transactions')}>View all</span>
                      </div>
                      <div className="pro-message-list">
                        {[...stats.listHeaders].reverse().slice(0, 5).map((h: SaleHeaderDoc) => (
                          <div className="pro-msg-item" key={h.$id}>
                            <div className="pro-msg-avatar" style={{ backgroundColor: pmOf(h) === 'cash' ? '#d1fae5' : pmOf(h) === 'qris' ? '#dbeafe' : '#dbeafe', color: pmOf(h) === 'cash' ? SUCCESS : pmOf(h) === 'qris' ? PRIMARY : PRIMARY }}>
                              {pmOf(h) === 'cash' ? <Banknote size={20} /> : pmOf(h) === 'qris' ? <QrCode size={20} /> : <ArrowLeftRight size={20} />}
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
                        <h3 className="pro-card-title">Most Popular</h3>
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
                        <span className="dashboard-label">Payment</span>
                        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="dashboard-select">
                          {paymentOptions.map((m) => (
                            <option key={m} value={m}>{m === 'all' ? 'All' : PAYMENT_LABELS[m] || m}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="dashboard-kpi-grid pro-kpi-grid">
                    <div className="pro-card" style={{ background: '#f8fafc', color: '#1e293b', borderLeft: '4px solid var(--pro-primary)', padding: '20px' }}>
                      <TrendingUp size={24} color="var(--pro-primary)" style={{ marginBottom: '12px' }} />
                      <span className="kpi-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Net Sales</span>
                      <span className="kpi-value" style={{ display: 'block', fontSize: '22px', fontWeight: 900 }}>Rp{stats.revenue.toLocaleString()}</span>
                    </div>
                    <div className="pro-card" style={{ background: '#f8fafc', borderLeft: `4px solid ${stats.netProfit >= 0 ? '#10b981' : '#ef4444'}`, padding: '20px' }}>
                      <Activity size={24} color={stats.netProfit >= 0 ? '#10b981' : '#ef4444'} style={{ marginBottom: '12px' }} />
                      <span className="kpi-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Profit</span>
                      <span className="kpi-value" style={{ display: 'block', fontSize: '22px', fontWeight: 900, color: stats.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                        {stats.netProfit < 0 ? '-' : ''}Rp{Math.abs(stats.netProfit).toLocaleString()}
                      </span>
                    </div>
                    <div className="pro-card" style={{ background: '#f8fafc', borderLeft: '4px solid #facc15', padding: '20px' }}>
                      <ArrowLeftRight size={24} color="#facc15" style={{ marginBottom: '12px' }} />
                      <span className="kpi-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Transactions</span>
                      <span className="kpi-value" style={{ display: 'block', fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>{stats.transactionCount}</span>
                    </div>
                    <div className="pro-card" style={{ background: '#f8fafc', borderLeft: '4px solid var(--pro-primary)', padding: '20px' }}>
                      <Package size={24} color="var(--pro-primary)" style={{ marginBottom: '12px' }} />
                      <span className="kpi-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Items Sold</span>
                      <span className="kpi-value" style={{ display: 'block', fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>{stats.itemsSold.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <div className="pro-card" style={{ flex: 1, padding: '12px 16px', background: '#f8fafc' }}>
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Avg. Ticket</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>Rp{stats.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="pro-card" style={{ flex: 1, padding: '12px 16px', background: '#f8fafc' }}>
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Margin</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: stats.margin >= 0 ? '#10b981' : '#ef4444' }}>{stats.margin.toFixed(1)}%</span>
                    </div>
                    <div className="pro-card" style={{ flex: 1, padding: '12px 16px', background: '#f8fafc' }}>
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Expenses</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#ef4444' }}>-Rp{stats.totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pro-card chart-hero" style={{ marginBottom: '24px' }}>
                    <h3 className="pro-card-title">Revenue Trend</h3>
                    <div style={{ marginTop: '20px' }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats.chartData} margin={{ left: -20 }}>
                          <XAxis dataKey="label" stroke={MUTED} fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis stroke={MUTED} fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => [`Rp${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                          <Area type="monotone" dataKey="value" stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.05} strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="pro-two-col" style={{ marginBottom: '24px' }}>
                    <div className="pro-card">
                      <h3 className="pro-card-title">Peak Hours</h3>
                      <div style={{ marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={stats.topHours}>
                            <XAxis dataKey="name" stroke={MUTED} fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v) => [`Rp${Number(v).toLocaleString()}`, 'Sales']} cursor={{ fill: '#f1f5f9' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {stats.topHours.map((_, index) => {
                                let c = '#94a3b8';
                                if (index === 0) c = '#10b981';
                                else if (index === 1) c = '#facc15';
                                else if (index === 2) c = '#f97316';
                                else if (index === 3) c = '#ef4444';
                                return <Cell key={`cell-${index}`} fill={c} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="pro-card">
                      <h3 className="pro-card-title">Payment Methods</h3>
                      <div style={{ marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={stats.paymentData}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {stats.paymentData.map((_, index) => (
                                <Cell key={index} fill={['#3d7066', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'][index % 5]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => `Rp${Number(v).toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="pro-two-col">
                    <div className="pro-card">
                      <h3 className="pro-card-title">Best Selling Products</h3>
                      <div className="prod-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats.bestSelling.slice(0, 8).map((p, idx) => (
                          <div key={p.id} className="prod-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="prod-rank" style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: idx === 0 ? 'linear-gradient(135deg, #10b981, #059669)' : idx === 1 ? 'linear-gradient(135deg, #facc15, #ca8a04)' : idx === 2 ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: idx < 3 ? 'white' : '#475569',
                                boxShadow: idx < 3 ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                              }}>{idx + 1}</div>
                              <div className="prod-info" style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="prod-name" style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{p.name}</span>
                                <span className="prod-qty" style={{ fontSize: '12px', color: '#64748b' }}>{p.qty} items sold</span>
                              </div>
                            </div>
                            <div className="prod-revenue" style={{ fontWeight: 800, color: idx === 0 ? '#10b981' : '#3d7066' }}>Rp{p.revenue.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pro-card">
                      <h3 className="pro-card-title">Distribution</h3>
                      <div style={{ marginTop: '20px' }}>
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
              allProducts={products}
              loading={formLoading}
              getRecipeCost={getRecipeCost}
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

          {/* Recipe Detail Modal */}
          {viewingRecipe && (
            <div className="modal-overlay">
              <div className="modal-card" style={{ maxWidth: '500px' }}>
                <header className="modal-header">
                  <div>
                    <h3 style={{ margin: 0 }}>{viewingRecipe.name}</h3>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Ingredient List ({recipeLines.filter(l => l.recipeId === viewingRecipe.$id).length} items)</p>
                  </div>
                  <button className="close-btn" onClick={() => setViewingRecipe(null)}><X size={20} /></button>
                </header>
                <div className="modal-content" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th align="right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipeLines.filter(l => l.recipeId === viewingRecipe.$id).map(line => {
                        const ing = ingredients.find(i => i.$id === line.ingredientId);
                        return (
                          <tr key={line.$id}>
                            <td>{ing?.name || 'Unknown Ingredient'}</td>
                            <td align="right" className="font-bold">{line.quantity} {line.unit || ing?.baseUnit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <footer className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <span className="text-muted" style={{ fontSize: 13 }}>Yield: <strong>{viewingRecipe.yield} units</strong></span>
                  </div>
                  <button className="app-btn-primary" onClick={() => setViewingRecipe(null)}>Close</button>
                </footer>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
