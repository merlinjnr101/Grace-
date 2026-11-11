import React from 'react';
import { Eye, ShoppingBag, Star, Sparkles } from 'lucide-react';
import type { Product } from '../services/api.ts';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onQuickAdd }) => {
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const primaryImage = product.images[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80";

  return (
    <div className="group relative bg-[#121215] rounded-xl overflow-hidden border border-[#27272a] hover:border-[#d4af37]/60 transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-[#d4af37]/10">
      
      {/* Image Container with Badges & Hover Controls */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#18181b] cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Dim Overlay on hover */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNewArrival && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#d4af37] text-black shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> New Drop
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#18181b]/90 text-[#f3e5ab] border border-[#d4af37]/40">
              Best Seller
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-600 text-white">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick Actions overlay */}
        <div className="absolute bottom-3 inset-x-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex-1 py-2 rounded-lg bg-[#09090b]/90 hover:bg-[#09090b] text-white text-xs font-semibold tracking-wider uppercase border border-[#d4af37]/40 flex items-center justify-center gap-1.5 backdrop-blur-sm cursor-pointer transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Details</span>
          </button>

          {!isOutOfStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(product);
              }}
              className="py-2 px-3 rounded-lg gold-gradient-bg text-black font-bold text-xs flex items-center justify-center hover:opacity-90 shadow-md cursor-pointer transition-all"
              title="Add to Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#71717a] uppercase tracking-wider mb-1">
            <span>{product.category}</span>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-amber-400 font-medium">Only {product.stock} left</span>
            )}
          </div>

          <h3 
            onClick={() => onSelect(product)}
            className="text-sm font-semibold text-white tracking-wide hover:text-[#d4af37] transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>
          
          <p className="text-xs text-[#a1a1aa] line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Sizes and Price */}
        <div className="pt-2 border-t border-[#27272a]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[#d4af37] font-mono">
                ₦{(product.discountPrice || product.price).toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs text-[#71717a] line-through font-mono">
                  ₦{product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Available Sizes Badge preview */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-[#a1a1aa]">
                <span className="hidden sm:inline font-mono">{product.sizes.slice(0, 3).join('/')}</span>
                {product.sizes.length > 3 && <span>+{product.sizes.length - 3}</span>}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
