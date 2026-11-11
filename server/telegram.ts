import dotenv from 'dotenv';
import { db } from './db.js';
import type { Order, CustomerComment, SupportConversation } from './types.js';

dotenv.config();

// Secrets strictly kept on server
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "9007200822:AAHslRZrdxHzV1_hjFlCqOrgUDvazx5mELA";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "6724972542";
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
  description?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    reply_to_message?: {
      message_id: number;
      text?: string;
    };
  };
}

class TelegramService {
  private lastUpdateId: number = 0;
  private isPolling: boolean = false;
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startBackgroundPoller();
  }

  /**
   * Send arbitrary message to the Admin chat
   */
  public async sendMessage(text: string, replyToMessageId?: number): Promise<{ success: boolean; messageId?: number; error?: string }> {
    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
      console.warn("[TelegramService] Telegram credentials not configured");
      return { success: false, error: "Telegram credentials not configured" };
    }

    try {
      const payload: Record<string, any> = {
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: 'HTML'
      };

      if (replyToMessageId) {
        payload.reply_to_message_id = replyToMessageId;
      }

      const res = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data: TelegramSendMessageResponse = await res.json();
      if (!data.ok) {
        console.error("[TelegramService send error]", data.description);
        return { success: false, error: data.description };
      }

      return { success: true, messageId: data.result?.message_id };
    } catch (err: any) {
      console.error("[TelegramService network error]", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Formats and dispatches a New Order alert to Telegram
   */
  public async notifyNewOrder(order: Order): Promise<boolean> {
    const productsList = order.items.map(i => i.productName).join(', ');
    const sizesList = order.items.map(i => `${i.productName}: ${i.size}`).join(' | ');
    const colorsList = order.items.map(i => `${i.productName}: ${i.color}`).join(' | ');
    const totalQty = order.items.reduce((acc, curr) => acc + curr.quantity, 0);
    const dateFormatted = new Date(order.createdAt).toLocaleString('en-US', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const message = 
`🛍️ <b>NEW SOG STORE ORDER!</b>

<b>Order Number:</b> ${order.orderNumber}
<b>Customer:</b> ${order.customerName}
<b>Phone:</b> ${order.customerPhone}
<b>Email:</b> ${order.customerEmail}
<b>Delivery Address:</b> ${order.deliveryAddress}, ${order.city}, ${order.state}

<b>Products:</b> ${productsList}
<b>Size:</b> ${sizesList}
<b>Color:</b> ${colorsList}
<b>Quantity:</b> ${totalQty}
<b>Total Amount:</b> ₦${order.totalAmount.toLocaleString()}
<b>Payment Status:</b> ${order.paymentStatus}
<b>Order Date:</b> ${dateFormatted}

<i>Please log in to the SOG admin dashboard to manage this order.</i>`;

    const res = await this.sendMessage(message);
    if (res.success && res.messageId) {
      db.saveTelegramMapping({
        telegramMessageId: res.messageId,
        conversationId: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        type: 'order',
        referenceId: order.id
      });
    }
    return res.success;
  }

  /**
   * Notify Admin about new product comment or review
   */
  public async notifyNewComment(comment: CustomerComment): Promise<boolean> {
    const stars = '⭐'.repeat(comment.rating || 5);
    const message = 
`💬 <b>NEW SOG PRODUCT COMMENT</b>

<b>Comment ID:</b> #${comment.id}
<b>Customer:</b> ${comment.customerName}
<b>Rating:</b> ${stars} (${comment.rating}/5)
${comment.productName ? `<b>Product:</b> ${comment.productName}\n` : ''}
<b>Comment:</b>
"${comment.comment}"

<i>Log in to SOG Admin Dashboard to review or reply.</i>`;

    const res = await this.sendMessage(message);
    if (res.success && res.messageId) {
      db.saveTelegramMapping({
        telegramMessageId: res.messageId,
        conversationId: comment.id,
        customerName: comment.customerName,
        customerPhone: '',
        type: 'comment',
        referenceId: comment.id
      });
    }
    return res.success;
  }

  /**
   * Dispatches new Customer Support inquiry to Telegram with 2-way reply mapping
   */
  public async notifySupportMessage(conversation: SupportConversation, messageText: string): Promise<boolean> {
    const formattedId = conversation.id.startsWith('#') ? conversation.id : `#${conversation.id}`;
    
    const message = 
`📩 <b>NEW CUSTOMER SUPPORT MESSAGE</b>

<b>Conversation ID:</b> ${formattedId}
<b>Customer:</b> ${conversation.customerName}
<b>Phone:</b> ${conversation.customerPhone}
<b>Email:</b> ${conversation.customerEmail || 'Not provided'}

<b>Message:</b>
${messageText}

<b>To reply to this customer:</b>
• Simply <b>Reply</b> directly to this message in Telegram, OR
• Type <code>/reply ${conversation.id} [your message]</code>`;

    const res = await this.sendMessage(message);
    if (res.success && res.messageId) {
      db.saveTelegramMapping({
        telegramMessageId: res.messageId,
        conversationId: conversation.id,
        customerName: conversation.customerName,
        customerPhone: conversation.customerPhone,
        type: 'support',
        referenceId: conversation.id
      });
    }
    return res.success;
  }

  /**
   * Handle incoming updates from Telegram (either Webhook or Polling)
   */
  public async processUpdate(update: TelegramUpdate): Promise<void> {
    const msg = update.message;
    if (!msg || !msg.text) return;

    const chatId = String(msg.chat.id);
    const text = msg.text.trim();

    // Verify chat is from authorized admin
    if (ADMIN_CHAT_ID && chatId !== String(ADMIN_CHAT_ID)) {
      console.warn(`[TelegramSecurity] Unauthorized message from chat ${chatId}`);
      await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "⛔ Access denied. This bot is dedicated to SOG – Son of Grace Wears store administration."
        })
      });
      return;
    }

    // 1. Handle commands
    if (text.startsWith('/start')) {
      await this.sendMessage(
        `👑 <b>SOG – SON OF GRACE WEARS BOT ACTIVE</b>\n\n` +
        `Welcome to the SOG Store Executive Bot.\n\n` +
        `<b>Available Commands:</b>\n` +
        `• <code>/orders</code> – View recent customer orders\n` +
        `• <code>/support</code> – View open customer support tickets\n` +
        `• <code>/reply &lt;ID&gt; &lt;msg&gt;</code> – Reply to customer\n` +
        `• <code>/stats</code> – Store performance summary\n` +
        `• <code>/help</code> – Show command reference\n\n` +
        `<i>Whenever a customer orders or contacts support, you'll receive real-time alerts right here. You can directly reply to support alerts to chat back to the website!</i>`
      );
      return;
    }

    if (text.startsWith('/help')) {
      await this.sendMessage(
        `📖 <b>SOG TELEGRAM BOT HELP</b>\n\n` +
        `1. <b>Two-Way Support:</b> When a support alert arrives, use Telegram's native "Reply" button or <code>/reply ID message</code> to answer directly to the website user.\n` +
        `2. <b>Orders:</b> Type <code>/orders</code> to see latest transactions.\n` +
        `3. <b>Support:</b> Type <code>/support</code> for active conversations.`
      );
      return;
    }

    if (text.startsWith('/orders')) {
      const orders = db.getOrders().slice(0, 5);
      if (orders.length === 0) {
        await this.sendMessage(`📦 <b>Recent Orders:</b>\n\nNo orders received yet. Catalog is ready for customers.`);
        return;
      }
      let orderMsg = `📦 <b>LATEST SOG STORE ORDERS:</b>\n\n`;
      for (const o of orders) {
        orderMsg += `• <b>${o.orderNumber}</b> | ${o.customerName} | ₦${o.totalAmount.toLocaleString()} | <b>${o.orderStatus}</b>\n`;
      }
      orderMsg += `\n<i>Log in to Admin Dashboard for full fulfillment controls.</i>`;
      await this.sendMessage(orderMsg);
      return;
    }

    if (text.startsWith('/support')) {
      const conversations = db.getConversations().slice(0, 5);
      if (conversations.length === 0) {
        await this.sendMessage(`💬 <b>Customer Support:</b>\n\nNo support conversations currently active.`);
        return;
      }
      let supMsg = `💬 <b>ACTIVE SUPPORT CONVERSATIONS:</b>\n\n`;
      for (const c of conversations) {
        supMsg += `• <b>#${c.id}</b> (${c.customerName}): "${c.lastMessage.slice(0, 35)}..." [${c.status.toUpperCase()}]\n`;
      }
      supMsg += `\n<i>Use <code>/reply ID Your response</code> to reply!</i>`;
      await this.sendMessage(supMsg);
      return;
    }

    if (text.startsWith('/stats')) {
      const orders = db.getOrders();
      const totalRevenue = orders
        .filter(o => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const pendingCount = orders.filter(o => o.orderStatus === 'Pending').length;
      const products = db.getProducts(false);
      const openSupport = db.getConversations().filter(c => c.status === 'open').length;

      await this.sendMessage(
        `📊 <b>SOG STORE EXECUTIVE METRICS:</b>\n\n` +
        `• <b>Total Revenue:</b> ₦${totalRevenue.toLocaleString()}\n` +
        `• <b>Total Orders:</b> ${orders.length} (${pendingCount} pending)\n` +
        `• <b>Products in Catalog:</b> ${products.length}\n` +
        `• <b>Open Support Inquiries:</b> ${openSupport}\n`
      );
      return;
    }

    // 2. Handle /reply <ID> <text> command
    const replyCmdMatch = text.match(/^\/reply\s+([a-zA-Z0-9#_-]+)\s+(.+)$/is);
    if (replyCmdMatch) {
      const targetId = replyCmdMatch[1].replace('#', '');
      const replyContent = replyCmdMatch[2].trim();
      const conv = db.getConversationById(targetId);
      if (!conv) {
        await this.sendMessage(`❌ Conversation #${targetId} not found in database.`);
        return;
      }

      // Add to DB
      db.addSupportMessage({
        conversationId: conv.id,
        sender: 'admin',
        senderName: 'SOG Concierge (Telegram)',
        message: replyContent
      });

      await this.sendMessage(
        `✅ <b>REPLY DELIVERED TO WEBSITE</b>\n\n` +
        `<b>Customer:</b> ${conv.customerName}\n` +
        `<b>Conversation:</b> #${conv.id}\n` +
        `<b>Delivered Message:</b> "${replyContent}"\n\n` +
        `<i>The customer can now see this in their website chat window in real-time.</i>`
      );
      return;
    }

    // 3. Handle Telegram native "Reply to message"
    if (msg.reply_to_message) {
      const parentId = msg.reply_to_message.message_id;
      const mapping = db.getTelegramMapping(parentId);

      if (mapping && mapping.type === 'support') {
        const conv = db.getConversationById(mapping.conversationId);
        if (conv) {
          db.addSupportMessage({
            conversationId: conv.id,
            sender: 'admin',
            senderName: 'SOG Concierge (Telegram)',
            message: text
          });

          await this.sendMessage(
            `✅ <b>REPLY DELIVERED TO ${conv.customerName.toUpperCase()}</b>\n` +
            `Ticket #${conv.id} updated on website.`,
            msg.message_id
          );
          return;
        }
      }

      // If replied to an order alert
      if (mapping && mapping.type === 'order') {
        await this.sendMessage(
          `ℹ️ This was an Order Alert for <b>${mapping.conversationId}</b> (${mapping.customerName}).\n` +
          `To manage or update this order, please visit the SOG Admin Dashboard or use the Order Management tab.`,
          msg.message_id
        );
        return;
      }
    }

    // Default response if generic text sent without command or reply
    await this.sendMessage(
      `👋 <i>Message received by SOG Store Server.</i>\n` +
      `To reply to a customer, use <b>Reply</b> directly to their support alert or type <code>/reply &lt;ID&gt; &lt;your message&gt;</code>. Type <code>/help</code> for commands.`
    );
  }

  /**
   * Background polling runner to guarantee 2-way Telegram messaging works
   * even behind firewalls/proxies without needing a public domain webhook.
   */
  private startBackgroundPoller() {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = async () => {
      try {
        if (!BOT_TOKEN) return;

        const url = `${TELEGRAM_API_BASE}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=5`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              if (update.update_id > this.lastUpdateId) {
                this.lastUpdateId = update.update_id;
                await this.processUpdate(update);
              }
            }
          }
        }
      } catch (e: any) {
        // Silently tolerate timeout or temporary network blips
      } finally {
        this.pollingTimer = setTimeout(poll, 2500);
      }
    };

    poll();
  }

  public stopBackgroundPoller() {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
    }
    this.isPolling = false;
  }
}

export const telegram = new TelegramService();
