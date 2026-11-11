import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, Flame, ArrowRight, Filter, 
  Crown, Star, MessageSquare, Truck, Clock, Heart, Award,
  CheckCircle2, ShoppingBag, Eye, RefreshCw
} from 'lucide-react';
import { 
  api, 
  type Product, 
  type CartItem, 
  type Order, 
  type CustomerComment, 
  type StoreSettings 
} from './services/api.ts';

import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductModal } from './components/ProductModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderTrackModal } from './components/OrderTrackModal.tsx';
import { ReviewModal } from './components/ReviewModal.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { LiveSupportChat } from './components/LiveSupportChat.tsx';

export default function App() {
  // Store Data States
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [comments, setComments] = useState<CustomerComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sog_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal States
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderTrackOpen, setOrderTrackOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(150000);

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem('sog_cart_items', JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save error", e);
    }
  }, [cart]);

  // Load Store Data
  const loadStoreData = async () => {
    setLoading(true);
    try {
      const [settingsData, productsData, commentsData] = await Promise.all([
        api.getSettings().catch(() => null),
        api.getProducts().catch(() => []),
        api.getComments().catch(() => [])
      ]);

      if (settingsData) setSettings(settingsData);
      setProducts(productsData);
      setComments(commentsData);
    } catch (err) {
      console.error("Store init failure", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product, size: string, color: string, quantity: number) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, size, color, quantity }];
      }
    });
    setCartOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    const defaultSize = product.sizes[0] || 'M';
    const defaultColor = product.colors[0]?.name || 'Standard';
    handleAddToCart(product, defaultSize, defaultColor, 1);
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]);
  };

  // Scroll Helpers
  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNewArrivals = () => {
    setSelectedCategory('all');
    setSortBy('newest');
    scrollToCatalog();
  };

  // Filtered and Sorted products
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }
    const price = p.discountPrice || p.price;
    if (price > maxPrice) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchTags = p.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discountPrice || a.price;
    const priceB = b.discountPrice || b.price;
    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  // Featured sections slices
  const newArrivals = products.filter(p => p.isNewArrival || p.isFeatured).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);
  const menClothing = products.filter(p => p.category === 'men' || p.category === 'streetwear').slice(0, 4);
  const womenClothing = products.filter(p => p.category === 'women').slice(0, 4);
  const shoesAndAccessories = products.filter(p => p.category === 'shoes' || p.category === 'accessories').slice(0, 4);

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
      
      {/* 1. Header / Navbar */}
      <Navbar
        settings={settings}
        cartCount={cartTotalCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenTrack={() => setOrderTrackOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
          scrollToCatalog();
        }}
        selectedCategory={selectedCategory}
        onSearch={(query) => {
          setSearchQuery(query);
          setSelectedCategory('all');
          scrollToCatalog();
        }}
      />

      {/* 2. Hero Section */}
      <Hero
        settings={settings}
        onExploreClick={scrollToCatalog}
        onNewArrivalsClick={scrollToNewArrivals}
      />

      {/* 3. New Arrivals Carousel / Grid */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-[#0c0c0e] border-b border-[#27272a]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Limited Drops
                </span>
                <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white">
                  NEW ARRIVALS
                </h2>
              </div>
              <button 
                onClick={scrollToCatalog}
                className="text-xs uppercase tracking-wider text-[#d4af37] hover:text-[#f3e5ab] font-bold flex items-center gap-1 group cursor-pointer"
              >
                <span>View Full Vault</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map(prod => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={(p) => setSelectedProduct(p)}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Complete Catalog & Live Storefront Archive */}
      <section id="catalog-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-10">
        
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#27272a]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">
                {selectedCategory === 'all' ? 'The Complete Archive' : selectedCategory.toUpperCase()}
              </span>
              <span className="text-[#71717a] font-mono text-xs">
                ({sortedProducts.length} {sortedProducts.length === 1 ? 'Garment' : 'Garments'})
              </span>
            </div>
            <h2 className="font-cinzel text-3xl font-bold text-white uppercase tracking-wide mt-1">
              {searchQuery ? `Search: "${searchQuery}"` : selectedCategory === 'all' ? 'Exclusive Collections' : selectedCategory}
            </h2>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Price Filter */}
            <div className="flex items-center gap-2 bg-[#121215] px-3.5 py-2 rounded-xl border border-[#27272a]">
              <span className="text-[#a1a1aa]">Max Price:</span>
              <span className="font-bold text-[#f3e5ab]">₦{maxPrice.toLocaleString()}</span>
              <input
                type="range"
                min={15000}
                max={150000}
                step={5000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-24 accent-[#d4af37] cursor-pointer"
              />
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-2 bg-[#121215] px-3.5 py-2 rounded-xl border border-[#27272a]">
              <span className="text-[#a1a1aa]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-white font-medium outline-none cursor-pointer"
              >
                <option value="featured" className="bg-[#121215]">Featured First</option>
                <option value="newest" className="bg-[#121215]">Newest Drops</option>
                <option value="price-low" className="bg-[#121215]">Price: Low to High</option>
                <option value="price-high" className="bg-[#121215]">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid or Strict Empty State */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#a1a1aa] font-semibold">
              Authenticating SOG Garments...
            </p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4 rounded-2xl bg-[#121215]/60 border border-[#27272a] p-8">
            <div className="w-16 h-16 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center mx-auto text-[#d4af37]">
              <ShoppingBag className="w-8 h-8 text-[#71717a]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-cinzel text-lg font-bold text-white uppercase">
                Catalog Awaiting Admin Publishing
              </h3>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                In strict adherence to store security protocols, products are uploaded, vetted, and approved exclusively through the private Admin Suite.
              </p>
            </div>
            <button
              onClick={() => setAdminOpen(true)}
              className="px-6 py-3 gold-gradient-bg font-extrabold text-black text-xs uppercase tracking-wider rounded-xl hover:opacity-95 transition shadow-lg shadow-[#d4af37]/20"
            >
              Open Admin Suite
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedProducts.map(prod => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={(p) => setSelectedProduct(p)}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Royal Bespoke Velvet Feature Banner */}
      <section className="py-16 bg-[#0c0c0e] border-y border-[#27272a]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#171510] via-[#121216] to-[#171510] border border-[#d4af37]/40 p-8 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-4 max-w-xl text-center md:text-left z-10">
              <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-bold flex items-center justify-center md:justify-start gap-1.5">
                <Flame className="w-4 h-4" />
                SOVEREIGN STREETWEAR
              </span>
              <h3 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                THE SOG SIGNATURE GOLD-STITCH SERIES
              </h3>
              <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed font-light">
                Every stitch of the SOG signature collection is threaded with 24K bullion metallic thread on 460GSM brushed French terry cotton. Engineered for supreme prestige.
              </p>
              <div className="pt-2">
                <button
                  onClick={scrollToCatalog}
                  className="px-7 py-3.5 gold-gradient-bg font-extrabold text-black text-xs uppercase tracking-widest rounded-full transition flex items-center gap-2 mx-auto md:mx-0 shadow-lg shadow-[#d4af37]/25"
                >
                  <span>Explore Drops</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden border border-[#d4af37]/50 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80"
                alt="SOG Signature Piece"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Customer Reviews & Praise Section */}
      <section className="py-20 bg-[#09090b] border-b border-[#27272a]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181b] border border-[#d4af37]/30 text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
              <Star className="w-3.5 h-3.5 fill-[#d4af37]" />
              <span>Verified Patron Reviews</span>
            </div>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-white uppercase">
              PRAISE FOR THE <span className="gold-gradient-text">SOG CRAFT</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa]">
              Real feedback from distinguished customers wearing Grace and Confidence across Nigeria and worldwide.
            </p>
          </div>

          {/* Curated Patron Quotes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
              <div className="flex gap-1 text-[#d4af37]">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#d4af37]" />)}
              </div>
              <h4 className="font-cinzel text-sm font-bold text-white">"Heavyweight 460GSM is unmatched"</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                "The Heavyweight Gold-Stitched Hoodie is unbelievable. You feel the weight, the bullion embroidery has authentic shimmer, and the oversized cut is runway standard."
              </p>
              <div className="pt-2 border-t border-[#27272a] text-xs text-[#71717a] flex justify-between">
                <span className="font-semibold text-white">Princewill Adeyemi</span>
                <span className="text-emerald-400">Lekki Phase 1, Lagos</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
              <div className="flex gap-1 text-[#d4af37]">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#d4af37]" />)}
              </div>
              <h4 className="font-cinzel text-sm font-bold text-white">"Instant Telegram Support & Delivery"</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                "I ordered via the website and got my confirmation alert on Telegram in seconds. The garment arrived in Abuja within 24 hours. Son of Grace is the real deal."
              </p>
              <div className="pt-2 border-t border-[#27272a] text-xs text-[#71717a] flex justify-between">
                <span className="font-semibold text-white">Chioma Nwosu</span>
                <span className="text-emerald-400">Maitama, Abuja</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#121215] border border-[#27272a] space-y-4">
              <div className="flex gap-1 text-[#d4af37]">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#d4af37]" />)}
              </div>
              <h4 className="font-cinzel text-sm font-bold text-white">"Velvet Track Set is Royalty"</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                "The Italian velour tailoring and gold zipper detailing makes heads turn anywhere I step into. Pure luxury streetwear. Proud to represent SOG."
              </p>
              <div className="pt-2 border-t border-[#27272a] text-xs text-[#71717a] flex justify-between">
                <span className="font-semibold text-white">Tariq Ibrahim</span>
                <span className="text-emerald-400">Port Harcourt, Rivers</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => {
                setReviewProduct(null);
                setReviewModalOpen(true);
              }}
              className="px-6 py-3 rounded-full bg-[#18181b] hover:bg-[#27272a] border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-bold uppercase tracking-wider transition"
            >
              + Submit Customer Comment or Review
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenTrack={() => setOrderTrackOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
          scrollToCatalog();
        }}
      />

      {/* 8. Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        settings={settings}
      />

      {/* 9. Product Details Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          comments={comments}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onOpenReview={(p) => {
            setSelectedProduct(null);
            setReviewProduct(p);
            setReviewModalOpen(true);
          }}
        />
      )}

      {/* 10. Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* 11. Order Tracking Modal */}
      <OrderTrackModal
        isOpen={orderTrackOpen}
        onClose={() => setOrderTrackOpen(false)}
      />

      {/* 12. Review Submission Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        product={reviewProduct}
        onReviewSubmitted={loadStoreData}
      />

      {/* 13. Admin Management Suite (Protected) */}
      <AdminPortal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onCatalogChanged={loadStoreData}
      />

      {/* 14. Real-Time Two-Way Live Support Chat Widget */}
      <LiveSupportChat />

    </div>
  );
}
