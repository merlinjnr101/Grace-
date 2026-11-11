import express, { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { telegram } from './telegram.js';
import type { OrderStatus, PaymentStatus } from './types.js';

const router = express.Router();

// Helper to get client IP for rate limiting
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Middleware: Strict Admin Authentication
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : (req.headers['x-admin-token'] as string);

  if (!token || !db.validateAdminSession(token)) {
    res.status(401).json({ error: "Unauthorized. Admin credentials required." });
    return;
  }
  next();
}

// ------------------------------------------------------------
// PUBLIC ENDPOINTS
// ------------------------------------------------------------

// 1. Get Store Settings
router.get('/settings', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  // Never expose sensitive fields in public responses
  res.json({
    storeName: settings.storeName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    storeAddress: settings.storeAddress,
    deliveryFee: settings.deliveryFee,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    announcementText: settings.announcementText,
    announcementActive: settings.announcementActive,
    socialInstagram: settings.socialInstagram,
    socialTwitter: settings.socialTwitter,
    socialFacebook: settings.socialFacebook,
    socialTiktok: settings.socialTiktok,
    currencySymbol: settings.currencySymbol,
    heroHeadline: settings.heroHeadline,
    heroSubheadline: settings.heroSubheadline,
    heroBannerImage: settings.heroBannerImage
  });
});

// 2. Get Published Products (Public)
router.get('/products', (req: Request, res: Response) => {
  const { category, search, featured, sort } = req.query;
  let products = db.getProducts(true);

  if (category && typeof category === 'string' && category !== 'all') {
    products = products.filter(p => p.category === category || p.subCategory?.toLowerCase() === category.toLowerCase());
  }

  if (featured === 'true') {
    products = products.filter(p => p.isFeatured);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (sort === 'price_asc') {
    products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (sort === 'price_desc') {
    products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (sort === 'newest') {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ products });
});

// 3. Get Single Product
router.get('/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product || !product.isPublished) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});

// 4. Submit Order (Public)
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      state, 
      city, 
      deliveryAddress, 
      items, 
      notes,
      paymentMethod = 'Bank Transfer / Card'
    } = req.body;

    if (!customerName || !customerPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Missing required order fields (name, phone, address, items)." });
      return;
    }

    // Server-side calculation to prevent tampering
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = db.getProductById(item.productId);
      if (!prod) {
        res.status(400).json({ error: `Product ${item.productName || item.productId} no longer exists.` });
        return;
      }
      if (prod.stock < item.quantity) {
        res.status(400).json({ error: `Sorry, insufficient stock for ${prod.name}. Available: ${prod.stock}` });
        return;
      }

      const unitPrice = prod.discountPrice || prod.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: prod.id,
        productName: prod.name,
        productImage: prod.images[0] || '',
        size: item.size || 'Standard',
        color: item.color || 'Standard',
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal
      });
    }

    const settings = db.getSettings();
    const deliveryFee = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
    const totalAmount = subtotal + deliveryFee;

    // Create Order with status Pending
    const order = db.createOrder({
      customerName,
      customerEmail: customerEmail || 'N/A',
      customerPhone,
      state: state || 'Lagos',
      city: city || 'Lagos',
      deliveryAddress,
      items: validatedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentStatus: 'Pending',
      paymentMethod,
      orderStatus: 'Pending',
      notes
    });

    // Notify Telegram Admin Immediately in required format
    await telegram.notifyNewOrder(order);

    res.status(201).json({
      success: true,
      message: "Order placed successfully. Admin has been notified.",
      order
    });
  } catch (err: any) {
    console.error("[Create Order Error]", err);
    res.status(500).json({ error: "Failed to process order: " + err.message });
  }
});

// 5. Track Order
router.get('/orders/track/:query', (req: Request, res: Response) => {
  const query = req.params.query.trim().toLowerCase();
  const orders = db.getOrders();
  const matched = orders.find(o => 
    o.orderNumber.toLowerCase() === query || 
    o.id.toLowerCase() === query ||
    o.customerPhone.toLowerCase() === query
  );

  if (!matched) {
    res.status(404).json({ error: "No order found matching that reference or phone number." });
    return;
  }

  // Return public tracking summary
  res.json({
    orderNumber: matched.orderNumber,
    customerName: matched.customerName,
    orderStatus: matched.orderStatus,
    paymentStatus: matched.paymentStatus,
    itemsCount: matched.items.length,
    totalAmount: matched.totalAmount,
    createdAt: matched.createdAt,
    updatedAt: matched.updatedAt
  });
});

// 6. Comments & Reviews (Public)
router.get('/comments', (req: Request, res: Response) => {
  const { productId } = req.query;
  let comments = db.getComments(true);
  if (productId && typeof productId === 'string') {
    comments = comments.filter(c => c.productId === productId);
  }
  res.json({ comments });
});

router.post('/comments', async (req: Request, res: Response) => {
  try {
    const { customerName, customerEmail, rating, comment, productId, productName } = req.body;
    if (!customerName || !comment) {
      res.status(400).json({ error: "Customer name and comment are required." });
      return;
    }

    const newComment = db.addComment({
      customerName,
      customerEmail,
      rating: Number(rating) || 5,
      comment,
      productId,
      productName
    });

    // Dispatch notification to Telegram
    await telegram.notifyNewComment(newComment);

    res.status(201).json({ success: true, comment: newComment });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit comment: " + err.message });
  }
});

// 7. Customer Support Live Chat (Public)
router.post('/support/message', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message, conversationId } = req.body;
    if (!message || (!conversationId && (!name || !phone))) {
      res.status(400).json({ error: "Missing required fields (name, phone, message)." });
      return;
    }

    const conv = db.getOrCreateConversation({
      name: name || 'Customer',
      email: email || '',
      phone: phone || '',
      conversationId
    });

    const msg = db.addSupportMessage({
      conversationId: conv.id,
      sender: 'customer',
      senderName: conv.customerName,
      message
    });

    // Forward to Telegram Administrator for two-way chat
    await telegram.notifySupportMessage(conv, message);

    res.status(201).json({
      success: true,
      conversationId: conv.id,
      conversation: conv,
      message: msg
    });
  } catch (err: any) {
    console.error("[Support message error]", err);
    res.status(500).json({ error: "Failed to send message: " + err.message });
  }
});

// 8. Poll Live Messages for a Support Conversation (Public, for user chat window)
router.get('/support/messages/:conversationId', (req: Request, res: Response) => {
  const convId = req.params.conversationId;
  const conv = db.getConversationById(convId);
  const messages = db.getMessages(convId);
  res.json({
    conversation: conv || null,
    messages
  });
});

// ------------------------------------------------------------
// TELEGRAM WEBHOOK (For public production deployments)
// ------------------------------------------------------------
router.post('/telegram/webhook', async (req: Request, res: Response) => {
  try {
    await telegram.processUpdate(req.body);
    res.status(200).send('OK');
  } catch (e: any) {
    console.error("[Telegram Webhook Error]", e);
    res.status(200).send('OK'); // Always ACK Telegram
  }
});

// ------------------------------------------------------------
// ADMIN AUTH & MANAGEMENT ENDPOINTS (Strictly Protected)
// ------------------------------------------------------------

// Admin Login with Rate Limiting & Attempt Protection
router.post('/admin/login', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const limit = db.checkRateLimit(ip);

  if (!limit.allowed) {
    res.status(429).json({
      error: `Too many failed attempts. Login locked for security. Please try again in ${limit.retryAfter} seconds.`
    });
    return;
  }

  const { password } = req.body;
  const configuredPassword = process.env.ADMIN_PASSWORD || 'grace_admin_2026!';

  if (password !== configuredPassword) {
    db.recordLoginAttempt(ip, false);
    const updatedLimit = db.checkRateLimit(ip);
    res.status(401).json({
      error: "Invalid administrator credentials.",
      remainingAttempts: updatedLimit.remainingAttempts
    });
    return;
  }

  // Success
  db.recordLoginAttempt(ip, true);
  const token = db.createAdminSession();
  res.json({
    success: true,
    token,
    message: "Administrator session established."
  });
});

// Admin Session Verification
router.get('/admin/me', requireAdmin, (_req: Request, res: Response) => {
  res.json({
    authenticated: true,
    role: 'administrator',
    store: db.getSettings().storeName
  });
});

// Admin Logout
router.post('/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-admin-token'] as string);
  if (token) {
    db.revokeAdminSession(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// Product Management (Admin-Only)
router.get('/admin/products', requireAdmin, (_req: Request, res: Response) => {
  const products = db.getProducts(false); // returns all, including unpublished
  res.json({ products });
});

router.post('/admin/products', requireAdmin, (req: Request, res: Response) => {
  const {
    name,
    slug,
    description,
    price,
    discountPrice,
    category,
    subCategory,
    sizes,
    colors,
    stock,
    images,
    specifications,
    tags,
    isFeatured = false,
    isPublished = true,
    isNewArrival = false,
    isBestSeller = false
  } = req.body;

  if (!name || !price || !category) {
    res.status(400).json({ error: "Name, price, and category are required." });
    return;
  }

  const product = db.createProduct({
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '',
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    category,
    subCategory: subCategory || '',
    sizes: Array.isArray(sizes) ? sizes : ["M", "L", "XL"],
    colors: Array.isArray(colors) ? colors : [{ name: "Black", hex: "#000000" }],
    stock: Number(stock) || 0,
    images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80"],
    specifications: Array.isArray(specifications) ? specifications : [],
    tags: Array.isArray(tags) ? tags : [],
    isFeatured: Boolean(isFeatured),
    isPublished: Boolean(isPublished),
    isNewArrival: Boolean(isNewArrival),
    isBestSeller: Boolean(isBestSeller)
  });

  res.status(201).json({ success: true, product });
});

router.put('/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ success: true, product: updated });
});

router.delete('/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ success: true, message: "Product deleted" });
});

// Admin-Only 1-Click SOG Signature Capsule Seeder
router.post('/admin/products/seed-capsule', requireAdmin, (_req: Request, res: Response) => {
  const seeded = db.seedSOGSampleCatalog();
  res.json({ success: true, count: seeded.length, products: seeded });
});

// Order Management (Admin-Only)
router.get('/admin/orders', requireAdmin, (_req: Request, res: Response) => {
  const orders = db.getOrders();
  res.json({ orders });
});

router.put('/admin/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { orderStatus, paymentStatus } = req.body;
  if (!orderStatus) {
    res.status(400).json({ error: "orderStatus is required" });
    return;
  }

  const updated = db.updateOrderStatus(req.params.id, orderStatus as OrderStatus, paymentStatus as PaymentStatus);
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ success: true, order: updated });
});

// Comments Moderation (Admin-Only)
router.get('/admin/comments', requireAdmin, (_req: Request, res: Response) => {
  const comments = db.getComments(false);
  res.json({ comments });
});

router.put('/admin/comments/:id', requireAdmin, (req: Request, res: Response) => {
  const { status, adminReply } = req.body;
  const updated = db.updateCommentStatus(req.params.id, status, adminReply);
  if (!updated) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.json({ success: true, comment: updated });
});

router.delete('/admin/comments/:id', requireAdmin, (req: Request, res: Response) => {
  const success = db.deleteComment(req.params.id);
  if (!success) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.json({ success: true, message: "Comment deleted" });
});

// Support Management (Admin-Only)
router.get('/admin/support', requireAdmin, (_req: Request, res: Response) => {
  const conversations = db.getConversations();
  res.json({ conversations });
});

router.get('/admin/support/:conversationId/messages', requireAdmin, (req: Request, res: Response) => {
  const messages = db.getMessages(req.params.conversationId);
  res.json({ messages });
});

router.post('/admin/support/reply', requireAdmin, (req: Request, res: Response) => {
  const { conversationId, message } = req.body;
  if (!conversationId || !message) {
    res.status(400).json({ error: "conversationId and message are required" });
    return;
  }

  const conv = db.getConversationById(conversationId);
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msg = db.addSupportMessage({
    conversationId: conv.id,
    sender: 'admin',
    senderName: 'SOG Administrator',
    message
  });

  res.json({ success: true, message: msg });
});

// Store Settings Management (Admin-Only)
router.get('/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  res.json({ settings: db.getSettings() });
});

router.put('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// Executive Dashboard Stats (Admin-Only)
router.get('/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const orders = db.getOrders();
  const products = db.getProducts(false);
  const comments = db.getComments(false);
  const conversations = db.getConversations();

  const totalRevenue = orders
    .filter(o => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = orders.filter(o => o.orderStatus === 'Pending').length;
  const shippedOrders = orders.filter(o => o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered').length;
  const openSupportTickets = conversations.filter(c => c.status === 'open').length;

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders,
    shippedOrders,
    totalProducts: products.length,
    lowStockProducts: products.filter(p => p.stock < 5).length,
    totalComments: comments.length,
    openSupportTickets,
    recentOrders: orders.slice(0, 5)
  });
});

// Test Telegram Bot Connectivity (Admin-Only)
router.post('/admin/test-telegram', requireAdmin, async (_req: Request, res: Response) => {
  const testMsg = 
`⚡ <b>SOG TELEGRAM CONNECTION TEST</b>\n\n` +
`Time: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}\n` +
`Status: All systems operational. Your SOG online store backend is communicating seamlessly with Telegram.`;

  const result = await telegram.sendMessage(testMsg);
  if (result.success) {
    res.json({ success: true, message: "Telegram test message sent successfully to owner!" });
  } else {
    res.status(500).json({ success: false, error: result.error || "Failed to reach Telegram" });
  }
});

export default router;
