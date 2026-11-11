import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, Truck, RotateCcw, Star, Check, Sparkles, MessageSquare } from 'lucide-react';
import type { Product, CustomerComment } from '../services/api.ts';

interface ProductModalProps {
  product: Product;
  comments: CustomerComment[];
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onOpenReview: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  comments,
  onClose,
  onAddToCart,
  onOpenReview
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80"
  );
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || 'Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');

  const isOutOfStock = product.stock <= 0;
  const productComments = comments.filter(c => c.productId === product.id);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedSize, selectedColor, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-[#121215] border border-[#d4af37]/40 rounded-2xl shadow-2xl shadow-black overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#18181b]/90 text-[#a1a1aa] hover:text-white hover:border-[#d4af37] border border-[#27272a] transition-all cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          
          {/* Left Column: Image Gallery */}
          <div className="p-6 sm:p-8 bg-[#09090b] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#27272a]">
            {/* Primary Preview */}
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#18181b] border border-[#27272a] relative">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              {product.isNewArrival && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase bg-[#d4af37] text-black shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> New Drop
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      selectedImage === img ? 'border-[#d4af37] shadow-md shadow-[#d4af37]/30' : 'border-[#27272a] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quality Seals */}
            <div className="mt-6 pt-4 border-t border-[#27272a]/60 grid grid-cols-2 gap-3 text-xs text-[#a1a1aa]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                <span>100% SOG Authentic</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#d4af37]" />
                <span>Express Nationwide</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Configurator */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Status */}
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#71717a] mb-2 font-medium">
                <span>{product.category} {product.subCategory && `• ${product.subCategory}`}</span>
                {isOutOfStock ? (
                  <span className="text-red-400 font-bold">Out of Stock</span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Stock ({product.stock} units)
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#d4af37] font-mono">
                  ₦{(product.discountPrice || product.price).toLocaleString()}
                </span>
                {product.discountPrice && product.discountPrice < product.price && (
                  <>
                    <span className="text-sm text-[#71717a] line-through font-mono">
                      ₦{product.price.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                      Save ₦{(product.price - product.discountPrice).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Description & Tabs */}
              <div className="mt-4 border-b border-[#27272a] flex items-center gap-6 text-xs font-semibold uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === 'details' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === 'specs' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  Specifications ({product.specifications?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'reviews' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reviews ({productComments.length})</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="py-3 min-h-[90px]">
                {activeTab === 'details' && (
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    {product.description}
                  </p>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-1.5 text-xs text-[#a1a1aa]">
                    {product.specifications && product.specifications.length > 0 ? (
                      product.specifications.map((spec, sIdx) => (
                        <div key={sIdx} className="flex justify-between py-1 border-b border-[#27272a]/40">
                          <span className="font-semibold text-[#f4f4f5]">{spec.key}:</span>
                          <span>{spec.value}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#71717a] italic">Handcrafted with premium materials.</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {productComments.length === 0 ? (
                      <p className="text-xs text-[#71717a] italic">No reviews yet. Be the first to review this piece!</p>
                    ) : (
                      productComments.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#f4f4f5]">{c.customerName}</span>
                            <div className="flex text-amber-400">
                              {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                            </div>
                          </div>
                          <p className="text-[#a1a1aa]">"{c.comment}"</p>
                          {c.adminReply && (
                            <div className="mt-1 pt-1 border-t border-[#27272a] text-[11px] text-[#d4af37]">
                              <strong>SOG Response:</strong> {c.adminReply}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => onOpenReview(product)}
                      className="mt-2 text-xs text-[#d4af37] underline hover:text-[#f3e5ab] cursor-pointer"
                    >
                      + Write a Review
                    </button>
                  </div>
                )}
              </div>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white uppercase tracking-wider">Select Size</span>
                    <span className="text-[#71717a]">{selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/30'
                            : 'bg-[#18181b] text-[#d4d4d8] hover:bg-[#27272a] border border-[#27272a]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white uppercase tracking-wider">Color Variant</span>
                    <span className="text-[#71717a]">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.colors.map((c, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => setSelectedColor(c.name)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                          selectedColor === c.name
                            ? 'border-[#d4af37] bg-[#d4af37]/10 text-white font-semibold'
                            : 'border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#3f3f46]'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/20" 
                          style={{ backgroundColor: c.hex }} 
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Picker */}
              <div className="space-y-2 mt-4">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Quantity</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#27272a] rounded-lg bg-[#18181b] overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-3 py-1.5 text-white hover:bg-[#27272a] disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold font-mono text-[#d4af37]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="px-3 py-1.5 text-white hover:bg-[#27272a] disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-[#71717a]">
                    Total: ₦{((product.discountPrice || product.price) * quantity).toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#27272a] flex items-center gap-3">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="flex-1 py-4 rounded-xl gold-gradient-bg text-black font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-95 shadow-xl shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? "Sold Out" : "Add to Shopping Bag"}</span>
              </button>

              <button
                onClick={() => onOpenReview(product)}
                className="py-4 px-4 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-[#d4af37] text-white transition-colors cursor-pointer"
                title="Write a Review"
              >
                <Star className="w-4 h-4 text-[#d4af37]" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
