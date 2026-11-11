import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, LogOut, Package, ShoppingCart, MessageSquare, 
  Settings, TrendingUp, AlertTriangle, CheckCircle2, Trash2, Edit3, 
  Plus, Send, RefreshCw, Eye, EyeOff, Sparkles, ExternalLink, Crown
} from 'lucide-react';
import { 
  api, 
  type Product, 
  type Order, 
  type CustomerComment, 
  type SupportConversation, 
  type SupportMessage, 
  type StoreSettings, 
  type DashboardStats 
} from '../services/api.ts';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogChanged: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose, onCatalogChanged }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'support' | 'comments' | 'settings'>('overview');

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [comments, setComments] = useState<CustomerComment[]>([]);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Product Form Modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    slug: '',
    description: '',
    price: 35000,
    discountPrice: undefined,
    category: 'streetwear',
    subCategory: '',
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Obsidian Black', hex: '#0a0a0c' }],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80'],
    specifications: [
      { key: 'Material', value: '100% Combed Heavyweight Cotton' },
      { key: 'Embroidery', value: 'Gold Bullion Thread' }
    ],
    tags: ['Streetwear', 'New Drop'],
    isFeatured: true,
    isPublished: true,
    isNewArrival: true,
    isBestSeller: false
  });

  // Support Chat state
  const [activeConv, setActiveConv] = useState<SupportConversation | null>(null);
  const [convMessages, setConvMessages] = useState<SupportMessage[]>([]);
  const [replyInput, setReplyInput] = useState('');

  // Telegram test feedback
  const [telegramTestStatus, setTelegramTestStatus] = useState<string | null>(null);

  // Check auth on open
  useEffect(() => {
    if (isOpen) {
      api.checkAdminAuth().then((auth) => {
        setIsAuthenticated(auth);
        if (auth) {
          loadAllData();
        }
      });
    }
  }, [isOpen]);

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [sData, pData, oData, cData, supData, setts] = await Promise.all([
        api.getAdminStats(),
        api.getAdminProducts(),
        api.getAdminOrders(),
        api.getAdminComments(),
        api.getAdminSupport(),
        api.getAdminSettings()
      ]);
      setStats(sData);
      setProducts(pData);
      setOrders(oData);
      setComments(cData);
      setConversations(supData);
      setSettings(setts);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      await api.adminLogin(passwordInput);
      setIsAuthenticated(true);
      setPasswordInput('');
      loadAllData();
    } catch (err: any) {
      setLoginError(err.message || "Invalid administrator credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.adminLogout();
    setIsAuthenticated(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productForm);
      } else {
        await api.createProduct(productForm);
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      await loadAllData();
      onCatalogChanged();
    } catch (err: any) {
      alert("Failed to save product: " + err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      await api.deleteProduct(id);
      await loadAllData();
      onCatalogChanged();
    } catch (err: any) {
      alert("Error deleting product: " + err.message);
    }
  };

  const handleSeedCapsule = async () => {
    if (!confirm("Load the signature SOG Capsule Collection into your catalog?")) return;
    try {
      setLoadingData(true);
      const res = await api.seedCapsule();
      alert(`Successfully loaded ${res.count} SOG Signature items into the catalog!`);
      await loadAllData();
      onCatalogChanged();
    } catch (err: any) {
      alert("Failed to import capsule: " + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, orderStatus: string, paymentStatus?: string) => {
    try {
      await api.updateOrderStatus(orderId, orderStatus, paymentStatus);
      await loadAllData();
    } catch (err: any) {
      alert("Failed to update order: " + err.message);
    }
  };

  const handleTestTelegram = async () => {
    setTelegramTestStatus("Testing bot transmission...");
    try {
      const res = await api.testTelegramConnection();
      setTelegramTestStatus("✅ " + res.message);
      setTimeout(() => setTelegramTestStatus(null), 5000);
    } catch (err: any) {
      setTelegramTestStatus("❌ " + err.message);
      setTimeout(() => setTelegramTestStatus(null), 6000);
    }
  };

  const handleSelectConv = async (conv: SupportConversation) => {
    setActiveConv(conv);
    try {
      const msgs = await api.getAdminSupportMessages(conv.id);
      setConvMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !replyInput.trim()) return;

    try {
      const msg = await api.adminReplySupport(activeConv.id, replyInput.trim());
      setConvMessages(prev => [...prev, msg]);
      setReplyInput('');
      await loadAllData();
    } catch (e: any) {
      alert("Error sending reply: " + e.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateAdminSettings(settings);
      alert("Website settings updated successfully!");
    } catch (e: any) {
      alert("Failed to update settings: " + e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div 
        className="relative w-full max-w-6xl h-[94vh] bg-[#0c0c0e] border border-[#d4af37]/40 rounded-2xl shadow-2xl shadow-black flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:px-6 bg-[#121215] border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#18181b] border border-[#d4af37]/40 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-base sm:text-lg font-bold text-white tracking-wide">
                  SOG Executive Admin Portal
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
                  Strict Security
                </span>
              </div>
              <p className="text-[11px] text-[#71717a]">Son of Grace Wears • Owner Control Station</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] border border-red-900/40 text-red-400 hover:bg-red-950/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Auth Gate vs Dashboard */}
        {!isAuthenticated ? (
          /* LOGIN GATE */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#09090b]">
            <div className="w-full max-w-md p-8 rounded-2xl bg-[#121215] border border-[#d4af37]/30 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-[#18181b] border border-[#d4af37]/40 text-[#d4af37] mx-auto flex items-center justify-center shadow-lg shadow-[#d4af37]/10">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="font-cinzel text-xl font-bold text-white">Owner Authorization</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Enter your server-side administrative password to manage inventory, fulfill orders, and monitor Telegram integration.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                    Security Key / Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter administrator password..."
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#71717a] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#71717a] mt-1.5">
                    Bootstrap default: <code className="text-[#d4af37]">grace_admin_2026!</code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loginLoading ? "Verifying..." : "Authorize Portal Access"}</span>
                </button>
              </form>

              <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] text-[11px] text-[#71717a] text-center">
                Protected by server-side rate-limiting & automated brute-force defense.
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#09090b]">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 bg-[#0e0e11] border-b md:border-b-0 md:border-r border-[#27272a] p-3 flex md:flex-col gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Executive Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Products ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Orders ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('support')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'support'
                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>2-Way Support ({conversations.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'comments'
                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Reviews ({comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Store Settings</span>
              </button>

              <div className="mt-auto hidden md:block pt-4 border-t border-[#27272a] text-center">
                <button
                  onClick={handleTestTelegram}
                  className="w-full py-2 px-3 rounded-lg bg-[#18181b] border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ping Telegram Bot</span>
                </button>
                {telegramTestStatus && (
                  <p className="text-[10px] text-white mt-1.5 animate-fadeIn">{telegramTestStatus}</p>
                )}
              </div>
            </div>

            {/* Main Tab Panel */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Store Executive Health</h3>
                    <p className="text-xs text-[#a1a1aa]">Real-time telemetry, revenue metrics, and automated Telegram status.</p>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
                      <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-semibold">Gross Revenue</span>
                      <p className="font-cinzel text-2xl font-bold text-[#d4af37] mt-1">₦{stats.totalRevenue.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-400">Total Store Sales</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
                      <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-semibold">Total Orders</span>
                      <p className="font-cinzel text-2xl font-bold text-white mt-1">{stats.totalOrders}</p>
                      <span className="text-[10px] text-amber-400">{stats.pendingOrders} pending verification</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
                      <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-semibold">Live Catalog</span>
                      <p className="font-cinzel text-2xl font-bold text-white mt-1">{stats.totalProducts} pieces</p>
                      <span className="text-[10px] text-[#a1a1aa]">{stats.lowStockProducts} low stock</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
                      <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-semibold">Open Support Tickets</span>
                      <p className="font-cinzel text-2xl font-bold text-white mt-1">{stats.openSupportTickets}</p>
                      <span className="text-[10px] text-blue-400">Connected to Telegram</span>
                    </div>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="p-4 rounded-xl bg-[#18181b] border border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#d4af37]" />
                        <span>SOG Catalog Quick-Load Option</span>
                      </h4>
                      <p className="text-xs text-[#a1a1aa] mt-0.5">
                        Start with a completely empty catalog, or click to import SOG Signature Capsule Collection immediately.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSeedCapsule}
                        className="px-4 py-2 rounded-lg gold-gradient-bg text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer"
                      >
                        Import SOG Capsule Collection
                      </button>
                    </div>
                  </div>

                  {/* Recent Orders Overview */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Orders Ledger</h4>
                    <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#18181b] text-[#a1a1aa] uppercase tracking-wider text-[10px] border-b border-[#27272a]">
                          <tr>
                            <th className="p-3">Order Ref</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27272a]">
                          {orders.slice(0, 5).map((o) => (
                            <tr key={o.id} className="hover:bg-[#18181b]/50">
                              <td className="p-3 font-mono font-bold text-[#d4af37]">{o.orderNumber}</td>
                              <td className="p-3 text-white">{o.customerName}</td>
                              <td className="p-3 font-mono">₦{o.totalAmount.toLocaleString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  o.orderStatus === 'Delivered' ? 'bg-emerald-950 text-emerald-400' :
                                  o.orderStatus === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                                  o.orderStatus === 'Pending' ? 'bg-amber-950 text-amber-300' :
                                  'bg-zinc-800 text-zinc-300'
                                }`}>
                                  {o.orderStatus}
                                </span>
                              </td>
                              <td className="p-3 text-[#71717a]">{new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {orders.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-[#71717a]">
                                No customer orders received yet. Live notifications will arrive on Telegram.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-cinzel text-xl font-bold text-white">Product Catalog Management</h3>
                      <p className="text-xs text-[#a1a1aa]">Strict Admin-Only Product Control. Manage inventory, pricing, and drops.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSeedCapsule}
                        className="px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold cursor-pointer hover:bg-[#d4af37]/10"
                      >
                        Import Capsule
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({
                            name: '',
                            slug: '',
                            description: '',
                            price: 45000,
                            category: 'streetwear',
                            sizes: ['S', 'M', 'L', 'XL'],
                            colors: [{ name: 'Obsidian Black', hex: '#000000' }],
                            stock: 20,
                            images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80'],
                            specifications: [{ key: 'Material', value: '100% Combed Heavy Cotton' }],
                            tags: ['Streetwear'],
                            isFeatured: true,
                            isPublished: true,
                            isNewArrival: true,
                            isBestSeller: false
                          });
                          setProductModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl gold-gradient-bg text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Product</span>
                      </button>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#18181b] text-[#a1a1aa] uppercase tracking-wider text-[10px] border-b border-[#27272a]">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Price (₦)</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3">Visibility</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-[#18181b]/50">
                            <td className="p-3 flex items-center gap-3">
                              <img
                                src={p.images[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80"}
                                alt=""
                                className="w-10 h-12 object-cover rounded bg-[#18181b]"
                              />
                              <div>
                                <h5 className="font-semibold text-white line-clamp-1">{p.name}</h5>
                                <div className="flex gap-1.5 mt-0.5">
                                  {p.isFeatured && <span className="text-[9px] text-[#d4af37] font-semibold">Featured</span>}
                                  {p.isNewArrival && <span className="text-[9px] text-emerald-400 font-semibold">• New Drop</span>}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 uppercase text-[#a1a1aa]">{p.category}</td>
                            <td className="p-3 font-mono text-[#d4af37] font-semibold">
                              ₦{(p.discountPrice || p.price).toLocaleString()}
                              {p.discountPrice && <span className="text-[10px] text-[#71717a] line-through block">₦{p.price.toLocaleString()}</span>}
                            </td>
                            <td className="p-3 font-mono">
                              <span className={p.stock <= 5 ? "text-red-400 font-bold" : "text-white"}>
                                {p.stock} units
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.isPublished ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                              }`}>
                                {p.isPublished ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setProductForm(p);
                                    setProductModalOpen(true);
                                  }}
                                  className="p-1.5 rounded bg-[#18181b] hover:text-[#d4af37] transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 rounded bg-[#18181b] hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {products.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-[#71717a]">
                              Catalog is currently empty. Click "Add New Product" or "Import Capsule" above to publish items.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Order Management & Fulfillment</h3>
                    <p className="text-xs text-[#a1a1aa]">View customer details, update status, and manage payments.</p>
                  </div>

                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] pb-3">
                          <div>
                            <span className="font-mono text-base font-bold text-[#d4af37]">{o.orderNumber}</span>
                            <span className="text-xs text-[#71717a] ml-3">{new Date(o.createdAt).toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Payment Status Dropdown */}
                            <select
                              value={o.paymentStatus}
                              onChange={(e) => handleUpdateOrderStatus(o.id, o.orderStatus, e.target.value)}
                              className="px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-semibold text-white focus:outline-none"
                            >
                              <option value="Pending">Payment: Pending</option>
                              <option value="Paid">Payment: Paid</option>
                              <option value="Failed">Payment: Failed</option>
                            </select>

                            {/* Fulfillment Status Dropdown */}
                            <select
                              value={o.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value, o.paymentStatus)}
                              className="px-2.5 py-1 rounded-lg bg-[#d4af37] text-black text-xs font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="Pending">Status: Pending</option>
                              <option value="Confirmed">Status: Confirmed</option>
                              <option value="Processing">Status: Processing</option>
                              <option value="Shipped">Status: Shipped</option>
                              <option value="Delivered">Status: Delivered</option>
                              <option value="Cancelled">Status: Cancelled</option>
                            </select>
                          </div>
                        </div>

                        {/* Customer & Address Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-[#71717a] uppercase text-[10px]">Customer</p>
                            <p className="font-bold text-white mt-0.5">{o.customerName}</p>
                            <p className="text-[#a1a1aa] font-mono">{o.customerPhone}</p>
                            <p className="text-[#a1a1aa]">{o.customerEmail}</p>
                          </div>
                          <div>
                            <p className="text-[#71717a] uppercase text-[10px]">Delivery Destination</p>
                            <p className="text-white mt-0.5 leading-relaxed">{o.deliveryAddress}</p>
                            <p className="text-[#d4af37]">{o.city}, {o.state}</p>
                          </div>
                          <div>
                            <p className="text-[#71717a] uppercase text-[10px]">Payment & Total</p>
                            <p className="text-white font-medium mt-0.5">{o.paymentMethod}</p>
                            <p className="font-mono text-base font-bold text-[#d4af37]">₦{o.totalAmount.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Items ordered */}
                        <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs space-y-1.5">
                          <p className="text-[10px] text-[#71717a] uppercase tracking-wider font-semibold">Ordered Pieces:</p>
                          {o.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[#d4d4d8]">
                              <span>• {item.productName} (Size: <strong className="text-white">{item.size}</strong>, Color: {item.color}) × {item.quantity}</span>
                              <span className="font-mono text-white">₦{item.totalPrice.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="p-8 text-center text-[#71717a] italic">No orders received yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SUPPORT & 2-WAY TELEGRAM CONVERSATIONS */}
              {activeTab === 'support' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[600px]">
                  {/* Left List */}
                  <div className="md:col-span-5 bg-[#121215] border border-[#27272a] rounded-xl overflow-y-auto p-3 space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Support Threads</h4>
                    {conversations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectConv(c)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          activeConv?.id === c.id
                            ? 'bg-[#d4af37]/15 border-[#d4af37] text-white'
                            : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white">#{c.id} • {c.customerName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                            c.status === 'open' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-[#71717a]">{c.lastMessage || "Started inquiry..."}</p>
                        <span className="text-[10px] text-[#71717a] font-mono mt-1 block">{c.customerPhone}</span>
                      </div>
                    ))}
                    {conversations.length === 0 && (
                      <p className="text-xs text-[#71717a] p-4 text-center">No customer support threads yet.</p>
                    )}
                  </div>

                  {/* Right Chat Panel */}
                  <div className="md:col-span-7 bg-[#121215] border border-[#27272a] rounded-xl flex flex-col justify-between overflow-hidden">
                    {activeConv ? (
                      <>
                        <div className="p-3 bg-[#18181b] border-b border-[#27272a] flex justify-between items-center">
                          <div>
                            <h5 className="text-xs font-bold text-white">#{activeConv.id} — {activeConv.customerName}</h5>
                            <span className="text-[10px] text-[#a1a1aa]">{activeConv.customerPhone} | {activeConv.customerEmail}</span>
                          </div>
                          <span className="text-[10px] text-[#d4af37] font-semibold">2-Way Telegram Sync</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#09090b]">
                          {convMessages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                              <div className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                                m.sender === 'admin'
                                  ? 'bg-[#d4af37] text-black font-medium'
                                  : 'bg-[#18181b] text-white border border-[#27272a]'
                              }`}>
                                <p className="text-[9px] font-bold uppercase mb-0.5 opacity-80">{m.senderName}:</p>
                                <p>{m.message}</p>
                              </div>
                              <span className="text-[9px] text-[#71717a] font-mono mt-0.5">{new Date(m.createdAt).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleAdminReply} className="p-3 bg-[#18181b] border-t border-[#27272a] flex gap-2">
                          <input
                            type="text"
                            placeholder="Type admin reply to customer..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg gold-gradient-bg text-black font-bold text-xs uppercase cursor-pointer"
                          >
                            Reply
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[#71717a]">
                        Select a support conversation from the list to view and reply.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: COMMENTS MODERATION */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Customer Reviews & Comments</h3>
                    <p className="text-xs text-[#a1a1aa]">Review customer feedback, publish responses, and delete spam.</p>
                  </div>

                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white text-sm">{c.customerName}</span>
                            <span className="text-xs text-amber-400 ml-2">{'★'.repeat(c.rating)}</span>
                            {c.productName && <span className="text-xs text-[#d4af37] ml-2">on {c.productName}</span>}
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm("Delete this comment?")) {
                                await api.deleteComment(c.id);
                                loadAllData();
                              }
                            }}
                            className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-xs text-[#d4d4d8]">"{c.comment}"</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="p-8 text-center text-[#71717a] italic">No customer reviews yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {activeTab === 'settings' && settings && (
                <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Store Configuration & Branding</h3>
                    <p className="text-xs text-[#a1a1aa]">Manage store contact details, announcement bar, and delivery rates.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Store Name</label>
                      <input
                        type="text"
                        value={settings.storeName}
                        onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Brand Slogan</label>
                      <input
                        type="text"
                        value={settings.tagline}
                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Announcement Banner Text</label>
                    <input
                      type="text"
                      value={settings.announcementText}
                      onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Delivery Fee (₦)</label>
                      <input
                        type="number"
                        value={settings.deliveryFee}
                        onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Free Delivery Threshold (₦)</label>
                      <input
                        type="number"
                        value={settings.freeDeliveryThreshold}
                        onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Contact Phone</label>
                      <input
                        type="text"
                        value={settings.contactPhone}
                        onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Contact Email</label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Showroom Address</label>
                    <input
                      type="text"
                      value={settings.storeAddress}
                      onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl gold-gradient-bg text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#121215] border border-[#d4af37]/40 rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setProductModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#a1a1aa] hover:text-white"
            >
              ✕
            </button>

            <h3 className="font-cinzel text-lg font-bold text-white mb-4">
              {editingProduct ? "Edit Product" : "Post New SOG Apparel Piece"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOG 450GSM Gold Embroidered Hoodie"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white uppercase mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white uppercase mb-1">Selling Price (₦) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white uppercase mb-1">Discount Price (₦)</label>
                  <input
                    type="number"
                    value={productForm.discountPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white uppercase mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e: any) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                  >
                    <option value="streetwear">Streetwear</option>
                    <option value="men">Men's Clothing</option>
                    <option value="women">Women's Clothing</option>
                    <option value="shoes">Shoes</option>
                    <option value="accessories">Accessories</option>
                    <option value="collections">Collections</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white uppercase mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white uppercase mb-1">Product Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={productForm.images?.[0] || ''}
                  onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isPublished}
                    onChange={(e) => setProductForm({ ...productForm, isPublished: e.target.checked })}
                    className="rounded text-[#d4af37]"
                  />
                  <span>Published Live</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="rounded text-[#d4af37]"
                  />
                  <span>Featured Collection</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isNewArrival}
                    onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                    className="rounded text-[#d4af37]"
                  />
                  <span>New Drop / Arrival</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#18181b] text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg gold-gradient-bg text-black font-bold text-xs uppercase"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
