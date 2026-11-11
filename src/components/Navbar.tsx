import React, { useState } from 'react';
import { ShoppingBag, Search, Shield, Truck, Menu, X, Crown, Sparkles } from 'lucide-react';
import type { StoreSettings } from '../services/api.ts';

interface NavbarProps {
  settings: StoreSettings | null;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenTrack: () => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenTrack,
  onSelectCategory,
  selectedCategory,
  onSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const categories = [
    { id: 'all', label: 'All Collections' },
    { id: 'streetwear', label: 'Streetwear' },
    { id: 'men', label: "Men's" },
    { id: 'women', label: "Women's" },
    { id: 'shoes', label: 'Shoes' },
    { id: 'accessories', label: 'Accessories' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/90 backdrop-blur-xl border-b border-[#27272a]/60">
      {/* Top Announcement Bar */}
      {settings?.announcementActive && (
        <div className="bg-gradient-to-r from-[#18181b] via-[#27272a] to-[#18181b] border-b border-[#d4af37]/20 py-1.5 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 mx-auto text-[#d4af37] font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{settings.announcementText}</span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-[#a1a1aa] text-xs">
              <button 
                onClick={onOpenTrack} 
                className="hover:text-[#d4af37] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Truck className="w-3 h-3" /> Track Order
              </button>
              <span className="text-[#3f3f46]">|</span>
              <button 
                onClick={onOpenAdmin} 
                className="hover:text-[#d4af37] transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                title="Admin Security Portal"
              >
                <Shield className="w-3 h-3 text-[#d4af37]" /> Admin Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#a1a1aa] hover:text-[#d4af37] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Identity / Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectCategory('all')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] via-[#aa771c] to-[#000] p-[1px] flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
              <div className="w-full h-full rounded-full bg-[#09090b] flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#d4af37]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-2xl font-black tracking-wider text-white">SOG</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">Haute Couture</span>
              </div>
              <p className="text-[10px] tracking-[0.25em] text-[#a1a1aa] uppercase font-medium">Son of Grace Wears</p>
            </div>
          </div>

          {/* Desktop Categories */}
          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-2 text-sm font-medium transition-all relative cursor-pointer tracking-wider uppercase ${
                  selectedCategory === cat.id
                    ? 'text-[#d4af37]'
                    : 'text-[#d4d4d8] hover:text-white'
                }`}
              >
                {cat.label}
                {selectedCategory === cat.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#d4d4d8] hover:text-[#d4af37] transition-colors cursor-pointer"
              aria-label="Search Collection"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Track Order (Mobile & Desktop) */}
            <button
              onClick={onOpenTrack}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#d4d4d8] hover:text-[#d4af37] px-3 py-1.5 rounded-full border border-[#27272a] hover:border-[#d4af37]/40 transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Track Order</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#d4af37]/60 text-white transition-all cursor-pointer group hover:shadow-lg hover:shadow-[#d4af37]/15"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#d4af37] group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-xs flex items-center justify-center animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Portal Direct (Mobile & Desktop) */}
            <button
              onClick={onOpenAdmin}
              className="p-2 text-[#71717a] hover:text-[#d4af37] transition-colors cursor-pointer lg:hidden"
              title="Admin Portal"
            >
              <Shield className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="bg-[#121215] border-t border-b border-[#27272a] px-4 py-3 animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-[#d4af37]" />
            <input
              type="text"
              placeholder="Search SOG luxury hoodies, silk tracksuits, footwear, tees, caps..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:outline-none text-sm placeholder-[#71717a]"
              autoFocus
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); onSearch(''); }}
                className="text-xs text-[#a1a1aa] hover:text-white"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#d4af37] text-black font-semibold text-xs tracking-wider uppercase hover:bg-[#ecd076] transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#09090b]/98 border-b border-[#27272a] px-4 pt-2 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  setMobileMenuOpen(false);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase text-left transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40'
                    : 'bg-[#18181b] text-[#d4d4d8] hover:bg-[#27272a]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#27272a] flex flex-col gap-2">
            <button
              onClick={() => { onOpenTrack(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 text-sm text-[#d4d4d8] py-2 px-3 rounded-lg bg-[#18181b]"
            >
              <Truck className="w-4 h-4 text-[#d4af37]" /> Track Existing Order
            </button>
            <button
              onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 text-sm text-[#d4af37] py-2 px-3 rounded-lg bg-[#18181b] border border-[#d4af37]/30"
            >
              <Shield className="w-4 h-4" /> Admin Security Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
