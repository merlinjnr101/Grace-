import React from 'react';
import { Crown, Shield, Mail, Phone, MapPin, Instagram, Twitter, Facebook, Heart } from 'lucide-react';
import type { StoreSettings } from '../services/api.ts';

interface FooterProps {
  settings: StoreSettings | null;
  onOpenAdmin: () => void;
  onOpenTrack: () => void;
  onSelectCategory: (category: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdmin,
  onOpenTrack,
  onSelectCategory
}) => {
  return (
    <footer className="bg-[#060608] border-t border-[#27272a] text-[#a1a1aa] text-xs">
      {/* Top Banner / Value Props */}
      <div className="border-b border-[#27272a]/60 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h5 className="font-bold text-white text-sm uppercase tracking-wider text-[#d4af37]">Authentic Haute Couture</h5>
            <p className="text-[11px] text-[#71717a]">Engineered from bespoke heavyweight cottons & metallic gold bullion thread.</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-white text-sm uppercase tracking-wider text-[#d4af37]">Nationwide Delivery</h5>
            <p className="text-[11px] text-[#71717a]">Express dispatch to Lagos, Abuja, Port Harcourt, and all Nigerian states.</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-white text-sm uppercase tracking-wider text-[#d4af37]">Telegram Integrated</h5>
            <p className="text-[11px] text-[#71717a]">Instant notification & direct two-way administrative concierge on Telegram.</p>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-white text-sm uppercase tracking-wider text-[#d4af37]">Strict Quality Vetting</h5>
            <p className="text-[11px] text-[#71717a]">Every single garment is inspected and signed by the SOG administrator.</p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Brand Manifesto */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-[#aa771c] p-[1px]">
                <div className="w-full h-full rounded-full bg-[#09090b] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[#d4af37]" />
                </div>
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-white tracking-wider">
                  SOG – SON OF GRACE
                </h3>
                <p className="text-[10px] text-[#d4af37] tracking-[0.2em] uppercase">Wear Grace. Wear Confidence.</p>
              </div>
            </div>

            <p className="text-xs text-[#71717a] leading-relaxed max-w-sm">
              SOG is a high-fashion luxury streetwear atelier founded on the principles of regal poise, grace, and unmatched confidence. Proudly designed and handcrafted in Nigeria.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={settings?.socialInstagram || "https://instagram.com"}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#121215] border border-[#27272a] hover:border-[#d4af37] hover:text-[#d4af37] transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialTwitter || "https://twitter.com"}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#121215] border border-[#27272a] hover:border-[#d4af37] hover:text-[#d4af37] transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialFacebook || "https://facebook.com"}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#121215] border border-[#27272a] hover:border-[#d4af37] hover:text-[#d4af37] transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Collections Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Curated Collections</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onSelectCategory('streetwear')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                  Haute Streetwear Hoodies
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('men')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                  Men's Regal Apparel
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('women')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                  Women's Divine Atelier
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('shoes')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                  High-Top Footwear & Sneakers
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('accessories')} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                  Headwear & Accessories
                </button>
              </li>
            </ul>
          </div>

          {/* Client Concierge & Support */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Client Concierge</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={onOpenTrack} className="hover:text-[#d4af37] transition-colors cursor-pointer">
                  Track Your Order
                </button>
              </li>
              <li>
                <span className="text-[#71717a]">Nationwide Delivery Policy</span>
              </li>
              <li>
                <span className="text-[#71717a]">Size Guide & Measurements</span>
              </li>
              <li>
                <span className="text-[#71717a]">Garment Care Instructions</span>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="text-[#d4af37] flex items-center gap-1 hover:underline cursor-pointer">
                  <Shield className="w-3 h-3" /> Admin Station
                </button>
              </li>
            </ul>
          </div>

          {/* Showroom & Contact */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Showroom & Headquarters</h4>
            <div className="space-y-2 text-xs text-[#71717a]">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <span>{settings?.storeAddress || "Lekki Phase 1, Victoria Island, Lagos, Nigeria"}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                <span className="font-mono text-white">{settings?.contactPhone || "+234 812 345 6789"}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                <span>{settings?.contactEmail || "concierge@sonofgracewears.com"}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Security */}
        <div className="pt-8 mt-8 border-t border-[#27272a]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717a]">
          <p>© {new Date().getFullYear()} SOG – Son of Grace Wears Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Wear Grace. Wear Confidence.</span>
            <span>•</span>
            <button onClick={onOpenAdmin} className="hover:text-[#d4af37] flex items-center gap-1 cursor-pointer">
              <Shield className="w-3 h-3 text-[#d4af37]" /> Staff Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
