import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react';
import type { CartItem, StoreSettings } from '../services/api.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: () => void;
  settings: StoreSettings | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  settings
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const threshold = settings?.freeDeliveryThreshold || 75000;
  const isFreeDelivery = subtotal >= threshold;
  const deliveryFee = isFreeDelivery ? 0 : (settings?.deliveryFee || 2500);
  const total = subtotal + deliveryFee;
  const remainingForFree = Math.max(0, threshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Body */}
      <div 
        className="w-full max-w-md bg-[#09090b] border-l border-[#27272a] h-full flex flex-col justify-between shadow-2xl z-10 animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
            <h2 className="font-cinzel text-lg font-bold text-white tracking-wide">
              Your Shopping Bag ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#121215] px-5 py-3 border-b border-[#27272a]/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#a1a1aa]">
              {isFreeDelivery ? (
                <span className="text-[#d4af37] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Qualified for Free Express Delivery!
                </span>
              ) : (
                <>Add <strong className="text-[#d4af37]">₦{remainingForFree.toLocaleString()}</strong> for Free Delivery</>
              )}
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#f5e7a3] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-[#71717a]">
              <div className="w-16 h-16 rounded-full bg-[#18181b] flex items-center justify-center border border-[#27272a]">
                <ShoppingBag className="w-8 h-8 text-[#3f3f46]" />
              </div>
              <div>
                <p className="text-white font-semibold">Your bag is empty</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Explore SOG's luxury street drops to add items.</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-wider hover:bg-[#d4af37]/10 transition-colors cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
              const unitPrice = item.product.discountPrice || item.product.price;
              const itemTotal = unitPrice * item.quantity;
              const image = item.product.images[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=500&q=80";

              return (
                <div key={`${item.product.id}-${item.size}-${item.color}-${idx}`} className="flex gap-4 p-3 rounded-xl bg-[#121215] border border-[#27272a] relative group">
                  {/* Thumbnail */}
                  <img
                    src={image}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded-lg bg-[#18181b] border border-[#27272a] flex-shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white line-clamp-1">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#a1a1aa] mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[10px] font-mono">
                          Size: {item.size}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[10px]">
                          {item.color}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#27272a] rounded-md bg-[#18181b]">
                        <button
                          onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                          className="px-2 py-0.5 text-xs text-white hover:bg-[#27272a] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-white hover:bg-[#27272a] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-bold text-[#d4af37] font-mono">
                        ₦{itemTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="absolute top-2 right-2 p-1.5 text-[#71717a] hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#27272a] bg-[#0c0c0e] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Subtotal</span>
                <span className="font-mono text-white">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Nationwide Delivery</span>
                <span className="font-mono">
                  {isFreeDelivery ? (
                    <span className="text-[#d4af37] font-semibold">FREE</span>
                  ) : (
                    `₦${deliveryFee.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#27272a]">
                <span>Estimated Total</span>
                <span className="font-mono text-[#d4af37]">₦{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-4 rounded-xl gold-gradient-bg font-bold text-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#71717a]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Direct Telegram Alerts & Verified Nigerian Delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
