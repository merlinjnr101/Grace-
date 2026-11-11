import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import type { StoreSettings } from '../services/api.ts';

interface HeroProps {
  settings: StoreSettings | null;
  onExploreClick: () => void;
  onNewArrivalsClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onExploreClick, onNewArrivalsClick }) => {
  return (
    <section className="relative overflow-hidden bg-[#09090b] border-b border-[#27272a]/50">
      {/* Background Ambience & Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#d4af37]/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -top-24 right-0 w-96 h-96 bg-[#997819]/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Manifesto & Call to Action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
            {/* Prestige Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181b]/80 border border-[#d4af37]/30 text-xs text-[#d4af37] font-semibold tracking-wider uppercase shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autumn / Winter Luxury Capsule</span>
            </div>

            {/* Slogan & Title */}
            <div className="space-y-3">
              <h1 className="font-cinzel text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08]">
                WEAR GRACE.<br />
                <span className="gold-gradient-text drop-shadow-sm">WEAR CONFIDENCE.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#a1a1aa] max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                {settings?.heroSubheadline || "Exclusive luxury streetwear and haute couture designed for royalty. Tailored with architectural precision, heavyweight cottons, and metallic gold accents."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-4 rounded-full gold-gradient-bg font-bold text-black text-sm tracking-wider uppercase hover:opacity-95 transition-all shadow-lg shadow-[#d4af37]/25 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore Full Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onNewArrivalsClick}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#121215] border border-[#d4af37]/40 text-[#f4f4f5] hover:text-white hover:border-[#d4af37] font-semibold text-sm tracking-wider uppercase transition-all cursor-pointer hover:bg-[#1c1c22]"
              >
                New Arrivals
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 border-t border-[#27272a]/60 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-1.5 text-[#d4af37] justify-center lg:justify-start mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">100% Authentic</span>
                </div>
                <p className="text-[11px] text-[#71717a]">Admin Inspected & Signed</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center gap-1.5 text-[#d4af37] justify-center lg:justify-start mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Express Dispatch</span>
                </div>
                <p className="text-[11px] text-[#71717a]">Nationwide Delivery</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center gap-1.5 text-[#d4af37] justify-center lg:justify-start mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Direct Telegram</span>
                </div>
                <p className="text-[11px] text-[#71717a]">Owner 2-Way Concierge</p>
              </div>
            </div>
          </div>

          {/* Right Column: High Fashion Editorial Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Gold Framing Ornament */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-[#d4af37]/40 via-transparent to-[#aa771c]/30 blur-sm" />
              
              <div className="relative rounded-2xl overflow-hidden bg-[#121215] border border-[#d4af37]/40 shadow-2xl shadow-black">
                <img
                  src={settings?.heroBannerImage || "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80"}
                  alt="SOG Son of Grace Streetwear Haute Couture"
                  className="w-full h-[480px] object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                
                {/* Overlay Card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#09090b]/85 backdrop-blur-md border border-[#d4af37]/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#d4af37] uppercase tracking-widest font-semibold">Signature Capsule</p>
                      <h4 className="text-sm font-cinzel font-bold text-white tracking-wide">Son of Grace Wears</h4>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
                      Limited Run
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
