import React, { useState } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, PackageCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api.ts';

interface OrderTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackModal: React.FC<OrderTrackModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setResult(null);

    try {
      setLoading(true);
      const data = await api.trackOrder(query.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || "No order found with this reference.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'Pending', label: 'Order Placed', desc: 'Received & logged in SOG ledger' },
    { key: 'Confirmed', label: 'Confirmed', desc: 'Payment verified by administrator' },
    { key: 'Processing', label: 'Processing', desc: 'Garments tailored & custom packaged' },
    { key: 'Shipped', label: 'Dispatched', desc: 'Handed to courier for delivery' },
    { key: 'Delivered', label: 'Delivered', desc: 'Delivered to recipient with grace' },
  ];

  const getCurrentStepIndex = (status: string) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 1;
      case 'Processing': return 2;
      case 'Shipped': return 3;
      case 'Delivered': return 4;
      default: return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-[#121215] border border-[#d4af37]/40 rounded-2xl shadow-2xl shadow-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between bg-[#0c0c0e]">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-[#d4af37]" />
            <h2 className="font-cinzel text-lg font-bold text-white tracking-wide">
              Track Your SOG Order
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#71717a] absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter Order Number (e.g. #SOG-101) or Phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl gold-gradient-bg text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Searching..." : "Track"}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-[#18181b] border border-[#d4af37]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">Order Reference</span>
                  <p className="font-mono text-base font-bold text-[#d4af37]">{result.orderNumber}</p>
                  <p className="text-xs text-white mt-0.5">Customer: {result.customerName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">Current Status</span>
                  <p className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 mt-1 inline-block">
                    {result.orderStatus}
                  </p>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="space-y-4 px-2">
                {steps.map((step, idx) => {
                  const currentIdx = getCurrentStepIndex(result.orderStatus);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      {idx < steps.length - 1 && (
                        <div 
                          className={`absolute left-3.5 top-8 w-0.5 h-8 -ml-[1px] transition-colors ${
                            idx < currentIdx ? 'bg-[#d4af37]' : 'bg-[#27272a]'
                          }`} 
                        />
                      )}
                      
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/30 scale-110'
                          : isCompleted
                          ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]'
                          : 'bg-[#18181b] text-[#52525b] border border-[#27272a]'
                      }`}>
                        {isCompleted && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-semibold uppercase tracking-wider ${
                            isCurrent ? 'text-[#d4af37]' : isCompleted ? 'text-white' : 'text-[#71717a]'
                          }`}>
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] text-[#d4af37] font-mono animate-pulse">Active Stage</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#71717a] mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Meta */}
              <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs flex justify-between text-[#a1a1aa]">
                <span>Total Amount: <strong className="text-white font-mono">₦{result.totalAmount.toLocaleString()}</strong></span>
                <span>Payment: <strong className="text-[#d4af37]">{result.paymentStatus}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
