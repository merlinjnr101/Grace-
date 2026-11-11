import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, type Product } from '../services/api.ts';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  product,
  onReviewSubmitted
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) return;

    try {
      setLoading(true);
      await api.submitComment({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        rating,
        comment: comment.trim(),
        productId: product?.id,
        productName: product?.name
      });
      setSuccess(true);
      onReviewSubmitted();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setComment('');
      }, 2000);
    } catch (err: any) {
      alert("Failed to submit review: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#121215] border border-[#d4af37]/40 rounded-2xl shadow-2xl shadow-black overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-white">Review Received!</h3>
            <p className="text-xs text-[#a1a1aa]">
              Thank you for sharing your experience. Your review has been posted and notified to the SOG administrative team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Customer Feedback
              </span>
              <h3 className="font-cinzel text-lg font-bold text-white mt-1">
                {product ? `Review ${product.name}` : "Leave a Testimonial for SOG"}
              </h3>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-[#3f3f46]'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-[#a1a1aa] ml-2 font-mono">({rating}/5 Stars)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. David A."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                Email (Optional)
              </label>
              <input
                type="email"
                placeholder="client@domain.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Your Review / Comment *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Share your thoughts on the craftsmanship, fit, embroidery, or delivery..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-lg"
            >
              {loading ? "Submitting Review..." : "Publish Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
