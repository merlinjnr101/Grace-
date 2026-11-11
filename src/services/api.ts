// Client API service for SOG Store

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: 'men' | 'women' | 'streetwear' | 'shoes' | 'accessories' | 'collections';
  subCategory?: string;
  sizes: string[];
  colors: ProductColor[];
  stock: number;
  images: string[];
  specifications: ProductSpec[];
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
  orderNumber: string;
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
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod: string;
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
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
  rating: number;
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
  createdAt: string;
}

export interface SupportConversation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'open' | 'replied' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
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

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalComments: number;
  openSupportTickets: number;
  recentOrders: Order[];
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

const getAdminToken = (): string | null => {
  return sessionStorage.getItem('sog_admin_token');
};

const adminHeaders = (): Record<string, string> => {
  const token = getAdminToken();
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const api = {
  // Public
  async getSettings(): Promise<StoreSettings> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async getProducts(params?: { category?: string; search?: string; featured?: boolean; sort?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.featured) query.set('featured', 'true');
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`/api/products?${query.toString()}`);
    const data = await res.json();
    return data.products || [];
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error("Product not found");
    const data = await res.json();
    return data.product;
  },

  async submitOrder(orderData: {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    state: string;
    city: string;
    deliveryAddress: string;
    items: { productId: string; size: string; color: string; quantity: number }[];
    notes?: string;
    paymentMethod: string;
  }): Promise<{ success: boolean; order: Order; message: string }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit order");
    return data;
  },

  async trackOrder(query: string): Promise<any> {
    const res = await fetch(`/api/orders/track/${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order not found");
    return data;
  },

  async getComments(productId?: string): Promise<CustomerComment[]> {
    const url = productId ? `/api/comments?productId=${productId}` : '/api/comments';
    const res = await fetch(url);
    const data = await res.json();
    return data.comments || [];
  },

  async submitComment(commentData: {
    customerName: string;
    customerEmail?: string;
    rating: number;
    comment: string;
    productId?: string;
    productName?: string;
  }): Promise<CustomerComment> {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit comment");
    return data.comment;
  },

  // Support
  async sendSupportMessage(msgData: {
    name: string;
    email: string;
    phone: string;
    message: string;
    conversationId?: string;
  }): Promise<{ conversationId: string; conversation: SupportConversation; message: SupportMessage }> {
    const res = await fetch('/api/support/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send message");
    return data;
  },

  async getSupportMessages(conversationId: string): Promise<{ conversation: SupportConversation | null; messages: SupportMessage[] }> {
    const res = await fetch(`/api/support/messages/${encodeURIComponent(conversationId)}`);
    return res.json();
  },

  // Admin
  async adminLogin(password: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    sessionStorage.setItem('sog_admin_token', data.token);
    return data;
  },

  async adminLogout(): Promise<void> {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: adminHeaders()
      });
    } finally {
      sessionStorage.removeItem('sog_admin_token');
    }
  },

  async checkAdminAuth(): Promise<boolean> {
    const token = getAdminToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/me', { headers: adminHeaders() });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getAdminStats(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/stats', { headers: adminHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  async getAdminProducts(): Promise<Product[]> {
    const res = await fetch('/api/admin/products', { headers: adminHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.products || [];
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create product");
    return data.product;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update product");
    return data.product;
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete product");
  },

  async seedCapsule(): Promise<{ count: number; products: Product[] }> {
    const res = await fetch('/api/admin/products/seed-capsule', {
      method: 'POST',
      headers: adminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to seed capsule");
    return data;
  },

  async getAdminOrders(): Promise<Order[]> {
    const res = await fetch('/api/admin/orders', { headers: adminHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.orders || [];
  },

  async updateOrderStatus(id: string, orderStatus: string, paymentStatus?: string): Promise<Order> {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ orderStatus, paymentStatus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update order");
    return data.order;
  },

  async getAdminComments(): Promise<CustomerComment[]> {
    const res = await fetch('/api/admin/comments', { headers: adminHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.comments || [];
  },

  async updateComment(id: string, status: string, adminReply?: string): Promise<CustomerComment> {
    const res = await fetch(`/api/admin/comments/${id}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ status, adminReply })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Failed to update comment");
    return data.comment;
  },

  async deleteComment(id: string): Promise<void> {
    const res = await fetch(`/api/admin/comments/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete comment");
  },

  async getAdminSupport(): Promise<SupportConversation[]> {
    const res = await fetch('/api/admin/support', { headers: adminHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.conversations || [];
  },

  async getAdminSupportMessages(convId: string): Promise<SupportMessage[]> {
    const res = await fetch(`/api/admin/support/${convId}/messages`, { headers: adminHeaders() });
    const data = await res.json();
    return data.messages || [];
  },

  async adminReplySupport(conversationId: string, message: string): Promise<SupportMessage> {
    const res = await fetch('/api/admin/support/reply', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ conversationId, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reply");
    return data.message;
  },

  async getAdminSettings(): Promise<StoreSettings> {
    const res = await fetch('/api/admin/settings', { headers: adminHeaders() });
    const data = await res.json();
    return data.settings;
  },

  async updateAdminSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    return data.settings;
  },

  async testTelegramConnection(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/test-telegram', {
      method: 'POST',
      headers: adminHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Telegram test failed");
    return data;
  }
};
