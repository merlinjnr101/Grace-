import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { 
  Product, 
  Order, 
  CustomerComment, 
  SupportConversation, 
  SupportMessage, 
  TelegramMessageMapping, 
  StoreSettings 
} from './types.js';

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  comments: CustomerComment[];
  supportConversations: SupportConversation[];
  supportMessages: SupportMessage[];
  telegramMappings: TelegramMessageMapping[];
  settings: StoreSettings;
  adminSessions: { token: string; expiresAt: number; createdAt: string }[];
  loginAttempts: { ip: string; attempts: number; lockedUntil: number }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sog_store.json');

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "SOG – Son of Grace Wears",
  tagline: "Wear Grace. Wear Confidence.",
  logoUrl: "/sog-logo.png",
  contactEmail: "support@sonofgracewears.com",
  contactPhone: "+234 812 345 6789",
  storeAddress: "Lekki Phase 1, Victoria Island, Lagos, Nigeria",
  deliveryFee: 2500,
  freeDeliveryThreshold: 75000,
  announcementText: "✨ NEW DROP: The Royal Grace Collection is live! Free express delivery on orders over ₦75,000",
  announcementActive: true,
  socialInstagram: "https://instagram.com/sonofgracewears",
  socialTwitter: "https://twitter.com/sonofgracewears",
  socialFacebook: "https://facebook.com/sonofgracewears",
  socialTiktok: "https://tiktok.com/@sonofgracewears",
  currencySymbol: "₦",
  heroHeadline: "Wear Grace. Wear Confidence.",
  heroSubheadline: "Modern luxury streetwear engineered with majestic craftsmanship and royal elegance.",
  heroBannerImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80"
};

class StoreDB {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.init();
  }

  private init(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          products: parsed.products || [],
          orders: parsed.orders || [],
          comments: parsed.comments || [],
          supportConversations: parsed.supportConversations || [],
          supportMessages: parsed.supportMessages || [],
          telegramMappings: parsed.telegramMappings || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          adminSessions: parsed.adminSessions || [],
          loginAttempts: parsed.loginAttempts || []
        };
      }
    } catch (e) {
      console.error("[DB Init Error]", e);
    }

    const initial: DatabaseSchema = {
      products: [], // Strictly empty by default until admin uploads real products
      orders: [],
      comments: [],
      supportConversations: [],
      supportMessages: [],
      telegramMappings: [],
      settings: DEFAULT_SETTINGS,
      adminSessions: [],
      loginAttempts: []
    };

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    } catch (err) {
      console.error("[DB write initial error]", err);
    }
    return initial;
  }

  private persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
      } catch (e) {
        console.error("[DB Persist Error]", e);
      }
    }, 100);
  }

  // --- PRODUCTS ---
  public getProducts(publishedOnly: boolean = true): Product[] {
    if (publishedOnly) {
      return this.data.products.filter(p => p.isPublished);
    }
    return [...this.data.products];
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: 'prod_' + crypto.randomUUID().slice(0, 8),
      createdAt: now,
      updatedAt: now
    };
    this.data.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    return [...this.data.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id || o.orderNumber.toLowerCase() === id.toLowerCase());
  }

  public createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    const now = new Date().toISOString();
    const count = this.data.orders.length + 101;
    const orderNumber = `#SOG-${count}`;
    const newOrder: Order = {
      ...orderData,
      id: 'ord_' + crypto.randomUUID().slice(0, 8),
      orderNumber,
      createdAt: now,
      updatedAt: now
    };
    this.data.orders.unshift(newOrder);

    // Update product stock counts
    for (const item of newOrder.items) {
      const prod = this.data.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    }

    this.persist();
    return newOrder;
  }

  public updateOrderStatus(id: string, orderStatus: Order['orderStatus'], paymentStatus?: Order['paymentStatus']): Order | null {
    const order = this.data.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;
    order.orderStatus = orderStatus;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    order.updatedAt = new Date().toISOString();
    this.persist();
    return order;
  }

  // --- COMMENTS & REVIEWS ---
  public getComments(approvedOnly: boolean = false): CustomerComment[] {
    if (approvedOnly) {
      return this.data.comments.filter(c => c.status === 'approved');
    }
    return [...this.data.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addComment(data: Omit<CustomerComment, 'id' | 'createdAt' | 'status'>): CustomerComment {
    const comment: CustomerComment = {
      ...data,
      id: 'cmt_' + crypto.randomUUID().slice(0, 6),
      status: 'approved', // instantly live with moderation capabilities
      createdAt: new Date().toISOString()
    };
    this.data.comments.unshift(comment);
    this.persist();
    return comment;
  }

  public updateCommentStatus(id: string, status: CustomerComment['status'], adminReply?: string): CustomerComment | null {
    const c = this.data.comments.find(item => item.id === id);
    if (!c) return null;
    c.status = status;
    if (adminReply !== undefined) {
      c.adminReply = adminReply;
    }
    this.persist();
    return c;
  }

  public deleteComment(id: string): boolean {
    const len = this.data.comments.length;
    this.data.comments = this.data.comments.filter(c => c.id !== id);
    if (this.data.comments.length !== len) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- SUPPORT CONVERSATIONS & MESSAGES ---
  public getConversations(): SupportConversation[] {
    return [...this.data.supportConversations].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  public getConversationById(id: string): SupportConversation | undefined {
    return this.data.supportConversations.find(
      c => c.id.toLowerCase() === id.toLowerCase() || c.id.toLowerCase() === id.replace('#', '').toLowerCase()
    );
  }

  public getOrCreateConversation(customer: { name: string; email: string; phone: string; conversationId?: string }): SupportConversation {
    if (customer.conversationId) {
      const existing = this.getConversationById(customer.conversationId);
      if (existing) return existing;
    }

    // Check by email or phone
    const existing = this.data.supportConversations.find(
      c => (c.customerEmail && c.customerEmail.toLowerCase() === customer.email.toLowerCase()) ||
           (c.customerPhone && c.customerPhone === customer.phone)
    );
    if (existing) return existing;

    const convCount = this.data.supportConversations.length + 101;
    const newConv: SupportConversation = {
      id: `SUPPORT${convCount}`,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      status: 'open',
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.data.supportConversations.unshift(newConv);
    this.persist();
    return newConv;
  }

  public getMessages(conversationId: string): SupportMessage[] {
    return this.data.supportMessages
      .filter(m => m.conversationId.toLowerCase() === conversationId.toLowerCase() || 
                   m.conversationId.toLowerCase() === conversationId.replace('#', '').toLowerCase())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addSupportMessage(msgData: {
    conversationId: string;
    sender: 'customer' | 'admin';
    senderName: string;
    message: string;
    telegramMessageId?: number;
  }): SupportMessage {
    const msg: SupportMessage = {
      id: 'msg_' + crypto.randomUUID().slice(0, 8),
      conversationId: msgData.conversationId.replace('#', ''),
      sender: msgData.sender,
      senderName: msgData.senderName,
      message: msgData.message,
      telegramMessageId: msgData.telegramMessageId,
      createdAt: new Date().toISOString()
    };
    this.data.supportMessages.push(msg);

    // Update conversation state
    const conv = this.getConversationById(msgData.conversationId);
    if (conv) {
      conv.lastMessage = msgData.message;
      conv.lastMessageAt = msg.createdAt;
      conv.status = msgData.sender === 'admin' ? 'replied' : 'open';
    }

    this.persist();
    return msg;
  }

  // --- TELEGRAM MAPPINGS ---
  public saveTelegramMapping(mapping: TelegramMessageMapping) {
    this.data.telegramMappings.push(mapping);
    this.persist();
  }

  public getTelegramMapping(telegramMessageId: number): TelegramMessageMapping | undefined {
    return this.data.telegramMappings.find(m => m.telegramMessageId === telegramMessageId);
  }

  // --- SETTINGS ---
  public getSettings(): StoreSettings {
    return { ...this.data.settings };
  }

  public updateSettings(updates: Partial<StoreSettings>): StoreSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };
    this.persist();
    return this.data.settings;
  }

  // --- ADMIN SECURITY & SESSIONS ---
  public checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfter?: number } {
    const now = Date.now();
    const entry = this.data.loginAttempts.find(l => l.ip === ip);
    if (!entry) return { allowed: true, remainingAttempts: 5 };

    if (entry.lockedUntil > now) {
      return { allowed: false, remainingAttempts: 0, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
    }

    return { allowed: true, remainingAttempts: Math.max(0, 5 - entry.attempts) };
  }

  public recordLoginAttempt(ip: string, success: boolean) {
    const now = Date.now();
    let entry = this.data.loginAttempts.find(l => l.ip === ip);
    if (!entry) {
      entry = { ip, attempts: 0, lockedUntil: 0 };
      this.data.loginAttempts.push(entry);
    }

    if (success) {
      entry.attempts = 0;
      entry.lockedUntil = 0;
    } else {
      entry.attempts += 1;
      if (entry.attempts >= 5) {
        entry.lockedUntil = now + (15 * 60 * 1000); // 15 mins lock
      }
    }
    this.persist();
  }

  public createAdminSession(): string {
    const token = 'sog_sec_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    this.data.adminSessions.push({
      token,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    this.persist();
    return token;
  }

  public validateAdminSession(token?: string): boolean {
    if (!token) return false;
    const now = Date.now();
    const session = this.data.adminSessions.find(s => s.token === token);
    if (!session) return false;
    if (session.expiresAt < now) {
      this.data.adminSessions = this.data.adminSessions.filter(s => s.token !== token);
      this.persist();
      return false;
    }
    return true;
  }

  public revokeAdminSession(token: string) {
    this.data.adminSessions = this.data.adminSessions.filter(s => s.token !== token);
    this.persist();
  }

  // --- OPTIONAL ADMIN CAPSULE SEEDER ---
  // To allow administrator to test or pre-load the authentic SOG collection with 1 click
  public seedSOGSampleCatalog(): Product[] {
    const sampleProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: "SOG 'Wear Grace' 450GSM Heavyweight Luxury Hoodie",
        slug: "sog-wear-grace-450gsm-luxury-hoodie",
        description: "Engineered from bespoke 450GSM organic combed cotton with majestic 24K-gold bullion high-density embroidery across the chest. Double-lined architectural hood, reinforced ribbing, and custom engraved brass aglets. The defining signature piece of Son of Grace Wears.",
        price: 52000,
        discountPrice: 46000,
        category: "streetwear",
        subCategory: "Hoodies",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: [
          { name: "Obsidian Black & Gold", hex: "#0a0a0c" },
          { name: "Alabaster White & Gold", hex: "#f8f8f6" },
          { name: "Royal Midnight Navy", hex: "#0f172a" }
        ],
        stock: 35,
        images: [
          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80"
        ],
        specifications: [
          { key: "Material", value: "100% Ultra-Heavy Combed Cotton (450 GSM)" },
          { key: "Embroidery", value: "Metallic Gold Bullion Thread Work" },
          { key: "Fit", value: "Tailored Streetwear Drop-Shoulder Oversize" },
          { key: "Care", value: "Hand wash cold inside out or dry clean only" }
        ],
        tags: ["Signature", "Streetwear", "Gold Embroidery", "Hoodie", "Best Seller"],
        isFeatured: true,
        isPublished: true,
        isNewArrival: true,
        isBestSeller: true
      },
      {
        name: "SOG Regal Crown Oversized Boxy Graphic Tee",
        slug: "sog-regal-crown-oversized-graphic-tee",
        description: "Crafted from 280GSM mercerized cotton featuring the majestic SOG Crown insignia embossed with metallic gold accents. Drop shoulder silhouette with seamless collar construction for all-day regal comfort.",
        price: 28500,
        discountPrice: 24000,
        category: "men",
        subCategory: "T-Shirts",
        sizes: ["M", "L", "XL", "XXL"],
        colors: [
          { name: "Pitch Black", hex: "#09090b" },
          { name: "Pristine Cream", hex: "#faf5ef" }
        ],
        stock: 50,
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80"
        ],
        specifications: [
          { key: "Fabric", value: "280GSM 100% Mercerized Combed Cotton" },
          { key: "Print", value: "High-Density Screen Print with Foil Gold" },
          { key: "Cut", value: "Boxy Modern Streetwear Fit" }
        ],
        tags: ["Graphic Tee", "Summer", "Regal", "Men"],
        isFeatured: true,
        isPublished: true,
        isNewArrival: true,
        isBestSeller: false
      },
      {
        name: "SOG Sovereign Silk-Blend Streetwear Tracksuit",
        slug: "sog-sovereign-silk-blend-tracksuit",
        description: "Two-piece luxury set combining satin-finish track jacket and tapered cargo jogger bottoms. Accented with brushed gold side piping, custom SOG monogram zippers, and waterproof utility pockets.",
        price: 98000,
        discountPrice: 85000,
        category: "collections",
        subCategory: "Tracksuits",
        sizes: ["S", "M", "L", "XL"],
        colors: [
          { name: "Stealth Onyx & Gold", hex: "#111113" },
          { name: "Emerald Royale", hex: "#064e3b" }
        ],
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80"
        ],
        specifications: [
          { key: "Composition", value: "65% Silk Blend, 35% Technical Nylon" },
          { key: "Hardware", value: "Custom Die-Cast SOG Gold Zippers" },
          { key: "Set Includes", value: "Jacket & Matching Tapered Pant" }
        ],
        tags: ["Tracksuit", "Luxury", "Two-Piece", "Exclusive"],
        isFeatured: true,
        isPublished: true,
        isNewArrival: true,
        isBestSeller: true
      },
      {
        name: "SOG Grace Aureate Tailored Cargo Trousers",
        slug: "sog-grace-aureate-tailored-cargo-trousers",
        description: "Bespoke tactical elegance. Relaxed tailored fit constructed from resilient twill with custom gold D-rings, modular cargo flaps, and expandable ankle cinch straps.",
        price: 45000,
        discountPrice: 39000,
        category: "men",
        subCategory: "Trousers",
        sizes: ["30", "32", "34", "36", "38"],
        colors: [
          { name: "Shadow Black", hex: "#121214" },
          { name: "Desert Sand", hex: "#d2b48c" }
        ],
        stock: 28,
        images: [
          "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80"
        ],
        specifications: [
          { key: "Material", value: "Heavyweight Cotton Twill (320 GSM)" },
          { key: "Closure", value: "YKK Metal Zipper with Gold Button" },
          { key: "Pockets", value: "6 Functional Utility Pockets" }
        ],
        tags: ["Cargos", "Pants", "Streetwear", "Men"],
        isFeatured: false,
        isPublished: true,
        isNewArrival: false,
        isBestSeller: true
      },
      {
        name: "SOG Divine Elegance Velvet Corset Dress",
        slug: "sog-divine-elegance-velvet-corset-dress",
        description: "High-fashion sculptured evening dress tailored in royal black velvet with gilded boning detail, delicate sweetheart neckline, and gold-trimmed asymmetric hemline. Confidence redefined.",
        price: 74000,
        discountPrice: 65000,
        category: "women",
        subCategory: "Dresses",
        sizes: ["XS", "S", "M", "L"],
        colors: [
          { name: "Royal Obsidian", hex: "#08080a" },
          { name: "Burgundy Grace", hex: "#4c0519" }
        ],
        stock: 15,
        images: [
          "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=80"
        ],
        specifications: [
          { key: "Fabric", value: "Premium Royal Stretch Silk Velvet" },
          { key: "Structure", value: "Reinforced Flexible Steel Boning" },
          { key: "Finish", value: "Satin Interior Lining for supreme comfort" }
        ],
        tags: ["Women", "Evening", "Velvet", "Luxury", "Corset"],
        isFeatured: true,
        isPublished: true,
        isNewArrival: true,
        isBestSeller: true
      },
      {
        name: "SOG Monogram Aureus High-Top Leather Sneakers",
        slug: "sog-monogram-aureus-high-top-sneakers",
        description: "Handcrafted Italian calfskin leather sneakers stamped with the SOG monogram gold foil emblem. Features ergonomic cushioned memory foam insole, vulcanized rubber cupsole, and gold metal lace locks.",
        price: 88000,
        discountPrice: 79000,
        category: "shoes",
        subCategory: "Sneakers",
        sizes: ["40", "41", "42", "43", "44", "45"],
        colors: [
          { name: "Monochrome Black & Gold", hex: "#111111" },
          { name: "Pure White & Gold", hex: "#ffffff" }
        ],
        stock: 22,
        images: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80"
        ],
        specifications: [
          { key: "Upper", value: "100% Genuine Full-Grain Calfskin Leather" },
          { key: "Sole", value: "Anti-Slip Durable Vulcanized Rubber" },
          { key: "Accents", value: "24K Gold Plated Lace Dubraes & Eyelets" }
        ],
        tags: ["Shoes", "Footwear", "Sneakers", "Leather"],
        isFeatured: true,
        isPublished: true,
        isNewArrival: false,
        isBestSeller: true
      },
      {
        name: "SOG 'Wear Grace' 3D Embroidered Snapback Cap",
        slug: "sog-wear-grace-3d-embroidered-snapback",
        description: "Structured 6-panel luxury snapback tailored from premium wool-blend twill. Embroidered with thick 3D metallic gold monogram lettering on front and 'Son of Grace Wears' arch over back closure.",
        price: 19500,
        discountPrice: 16500,
        category: "accessories",
        subCategory: "Headwear",
        sizes: ["One Size Fits All (Adjustable)"],
        colors: [
          { name: "All Black & Gold", hex: "#0f0f11" }
        ],
        stock: 45,
        images: [
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80"
        ],
        specifications: [
          { key: "Material", value: "80% Acrylic, 20% Wool Blend" },
          { key: "Closure", value: "Premium Embossed Matte Snapback" },
          { key: "Sweatband", value: "Moisture-Wicking Antimicrobial Cotton" }
        ],
        tags: ["Accessories", "Cap", "Hat", "Streetwear"],
        isFeatured: false,
        isPublished: true,
        isNewArrival: true,
        isBestSeller: false
      }
    ];

    const added: Product[] = [];
    for (const p of sampleProducts) {
      const created = this.createProduct(p);
      added.push(created);
    }
    return added;
  }
}

export const db = new StoreDB();
