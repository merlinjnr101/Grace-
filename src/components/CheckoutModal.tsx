import React, { useState } from 'react';
import { X, CheckCircle, Shield, AlertCircle, Copy, ArrowRight, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, type CartItem, type Order, type StoreSettings } from '../services/api.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings | null;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onOrderSuccess
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    state: 'Lagos',
    city: 'Lagos Island / Lekki',
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'Bank Transfer (Instant Admin Verification)'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const threshold = settings?.freeDeliveryThreshold || 75000;
  const isFreeDelivery = subtotal >= threshold;
  const deliveryFee = isFreeDelivery ? 0 : (settings?.deliveryFee || 2500);
  const totalAmount = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.customerName.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!formData.customerPhone.trim()) {
      setError("Please provide a valid phone number for courier delivery.");
      return;
    }
    if (!formData.deliveryAddress.trim()) {
      setError("Please enter your complete delivery address.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.submitOrder({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        state: formData.state,
        city: formData.city,
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        items: items.map(i => ({
          productId: i.product.id,
          size: i.size,
          color: i.color,
          quantity: i.quantity
        }))
      });

      // Celebration effect
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f5e7a3', '#ffffff', '#aa771c']
      });

      setConfirmedOrder(res.order);
      onOrderSuccess(res.order);
    } catch (err: any) {
      setError(err.message || "Failed to process your order. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const copyBankDetails = () => {
    navigator.clipboard.writeText("0123456789 - SOG Son of Grace Ventures - GTBank");
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#121215] border border-[#d4af37]/40 rounded-2xl shadow-2xl shadow-black overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-[#0c0c0e]">
          <div>
            <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold">Secure Checkout</span>
            <h2 className="font-cinzel text-xl font-bold text-white tracking-wide">
              {confirmedOrder ? "Order Confirmed & Received" : "Complete Your SOG Order"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          /* Confirmation State */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-cinzel text-2xl font-bold text-white">
                Thank You, {confirmedOrder.customerName}!
              </h3>
              <p className="text-sm text-[#a1a1aa]">
                Your order <strong className="text-[#d4af37] font-mono">{confirmedOrder.orderNumber}</strong> has been registered.
                The SOG administrator has received an instant notification on Telegram.
              </p>
            </div>

            {/* Payment & Bank Details Notice */}
            <div className="p-5 rounded-xl bg-[#18181b] border border-[#d4af37]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                  Payment Verification Details
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-medium border border-amber-800">
                  Status: Pending Approval
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                As per SOG security policies, every order is verified by our administrative concierge before dispatch. Please make the transfer of <strong className="text-white font-mono">₦{confirmedOrder.totalAmount.toLocaleString()}</strong>:
              </p>
              
              <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] flex items-center justify-between">
                <div className="text-xs">
                  <p className="text-white font-mono font-bold">Bank: Guaranty Trust Bank (GTBank)</p>
                  <p className="text-[#d4af37] font-mono">Account No: 0123456789</p>
                  <p className="text-[#a1a1aa]">Account Name: Son of Grace Wears Ltd</p>
                </div>
                <button
                  type="button"
                  onClick={copyBankDetails}
                  className="px-3 py-1.5 rounded-lg border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedBank ? "Copied!" : "Copy Details"}</span>
                </button>
              </div>

              <p className="text-[11px] text-[#71717a]">
                💡 Include your Order Reference <code className="text-[#d4af37]">{confirmedOrder.orderNumber}</code> in the transfer narration. You may also message our Live Support Concierge for instant confirmation.
              </p>
            </div>

            {/* Order Summary Recap */}
            <div className="p-4 rounded-xl bg-[#0e0e11] border border-[#27272a] text-xs space-y-2">
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Recipient:</span>
                <span className="text-white font-medium">{confirmedOrder.customerName} ({confirmedOrder.customerPhone})</span>
              </div>
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Destination:</span>
                <span className="text-white font-medium">{confirmedOrder.deliveryAddress}, {confirmedOrder.city}, {confirmedOrder.state}</span>
              </div>
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Items:</span>
                <span className="text-white font-medium">{confirmedOrder.items.length} item(s)</span>
              </div>
              <div className="flex justify-between text-[#a1a1aa] pt-2 border-t border-[#27272a]">
                <span className="font-bold text-white">Grand Total:</span>
                <span className="font-bold text-[#d4af37] font-mono text-sm">₦{confirmedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl gold-gradient-bg text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer"
              >
                Return to Store
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olumide Johnson"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  Phone Number (for courier dispatch) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +234 812 345 6789"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="client@domain.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  State *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja (FCT)">Abuja (FCT)</option>
                  <option value="Rivers (Port Harcourt)">Rivers (Port Harcourt)</option>
                  <option value="Oyo (Ibadan)">Oyo (Ibadan)</option>
                  <option value="Delta">Delta</option>
                  <option value="Edo">Edo</option>
                  <option value="Kano">Kano</option>
                  <option value="Enugu">Enugu</option>
                  <option value="Ogun">Ogun</option>
                  <option value="Other State">Other State</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  City / Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lekki / Ikeja / Garki"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Full Street Delivery Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="House number, street name, estate, landmarks..."
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Payment Channel
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
              >
                <option value="Bank Transfer (Instant Admin Verification)">Direct Bank Transfer (Manual verification via Telegram)</option>
                <option value="Card Gateway (Paystack/Flutterwave)">Debit / Credit Card (Secure Gateway)</option>
                <option value="Lagos Express Dispatch On Delivery">Pay on Delivery (Lagos Region Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                Order Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Special delivery instructions or gate security code"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Items Subtotal ({items.length} items):</span>
                <span className="font-mono text-white">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Delivery Charge:</span>
                <span className="font-mono">
                  {isFreeDelivery ? <span className="text-[#d4af37] font-bold">FREE</span> : `₦${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#27272a]">
                <span>Total Due:</span>
                <span className="text-[#d4af37] font-mono">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl gold-gradient-bg text-black font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-95 shadow-xl shadow-[#d4af37]/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? "Registering SOG Order..." : `Confirm Order (₦${totalAmount.toLocaleString()})`}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#71717a]">
              <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Strict Admin Telegram Dispatch Integration Enabled</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
