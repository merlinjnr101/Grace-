export type ProductCategory = 
  | 'men' 
  | 'women' 
  | 'streetwear' 
  | 'shoes' 
  | 'accessories' 
  | 'collections';

export type OrderStatus = 
  | 'Pending' 
  | 'Confirmed' 
  | 'Processing' 
  | 'Shipped' 
  | 'Delivered' 
  | 'Cancelled';

export type PaymentStatus = 
  | 'Pending' 
  | 'Paid' 
  | 'Failed';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // in NGN (Nigerian Naira ₦)
  discountPrice?: number;
  category: ProductCategory;
  subCategory?: string;
  sizes: string[]; // e.g. ["S", "M", "L", "XL", "XXL"]
  colors: { name: string; hex: string }[];
  stock: number;
  images: string[];
  specifications: { key: string; value: string }[];
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#SOG-1042"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  state: string;
  city: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerComment {
  id: string;
  productId?: string;
  productName?: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1-5
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  sender: 'customer' | 'admin';
  senderName: string;
  message: string;
  telegramMessageId?: number;
  createdAt: string;
}

export interface SupportConversation {
  id: string; // e.g. "SUPPORT102"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'open' | 'replied' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  telegramThreadId?: number;
  createdAt: string;
}

export interface TelegramMessageMapping {
  telegramMessageId: number;
  conversationId: string;
  customerName: string;
  customerPhone: string;
  type: 'support' | 'order' | 'comment';
  referenceId: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  storeAddress: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  announcementText: string;
  announcementActive: boolean;
  socialInstagram: string;
  socialTwitter: string;
  socialFacebook: string;
  socialTiktok: string;
  currencySymbol: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBannerImage: string;
}
