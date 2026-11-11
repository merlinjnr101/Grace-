import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Crown, Sparkles, CheckCheck } from 'lucide-react';
import { api, type SupportMessage } from '../services/api.ts';

export const LiveSupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    return localStorage.getItem('sog_support_conv_id');
  });

  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('sog_customer_name') || '';
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem('sog_customer_phone') || '';
  });
  const [customerEmail, setCustomerEmail] = useState(() => {
    return localStorage.getItem('sog_customer_email') || '';
  });

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for replies if conversationId exists
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;
    const fetchMessages = async () => {
      try {
        const data = await api.getSupportMessages(conversationId);
        if (isMounted && data.messages) {
          setMessages(prev => {
            // Count unread if window is closed
            if (!isOpen && data.messages.length > prev.length) {
              const newAdminMsgs = data.messages.slice(prev.length).filter(m => m.sender === 'admin');
              if (newAdminMsgs.length > 0) {
                setUnreadCount(c => c + newAdminMsgs.length);
              }
            }
            return data.messages;
          });
        }
      } catch (err) {
        // Silently tolerate background poll hiccups
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [conversationId, isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // First time customer must provide name & phone
    if (!conversationId && (!customerName.trim() || !customerPhone.trim())) {
      return;
    }

    const text = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const res = await api.sendSupportMessage({
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        message: text,
        conversationId: conversationId || undefined
      });

      if (!conversationId) {
        setConversationId(res.conversationId);
        localStorage.setItem('sog_support_conv_id', res.conversationId);
        localStorage.setItem('sog_customer_name', customerName);
        localStorage.setItem('sog_customer_phone', customerPhone);
        if (customerEmail) localStorage.setItem('sog_customer_email', customerEmail);
      }

      setMessages(prev => [...prev, res.message]);
    } catch (err: any) {
      console.error("Support message error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-4 rounded-full gold-gradient-bg text-black shadow-2xl shadow-[#d4af37]/40 hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer group"
          aria-label="Open Customer Support Concierge"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
          
          {/* Status Dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px] animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[520px] bg-[#0c0c0e] border border-[#d4af37]/40 rounded-2xl shadow-2xl shadow-black flex flex-col overflow-hidden animate-slideUp">
          
          {/* Header */}
          <div className="p-4 bg-[#121215] border-b border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6710] p-[1px]">
                <div className="w-full h-full rounded-full bg-[#09090b] flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-cinzel text-sm font-bold text-white tracking-wide">
                    SOG Concierge
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-[#d4af37]">Live Telegram Support</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#09090b]">
            
            {/* Welcome Message */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#18181b] border border-[#d4af37]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crown className="w-3 h-3 text-[#d4af37]" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-sm bg-[#18181b] border border-[#27272a] text-xs text-[#e4e4e7] max-w-[85%] leading-relaxed">
                <p className="font-semibold text-[#d4af37] mb-1">Peace & Grace,</p>
                Welcome to Son of Grace Wears. Ask about our drops, sizing, or custom orders. Our executive team receives messages directly on Telegram!
              </div>
            </div>

            {/* If no conversation yet: Intake details */}
            {!conversationId && (
              <div className="p-3.5 rounded-xl bg-[#121215] border border-[#d4af37]/30 space-y-2 text-xs">
                <p className="font-semibold text-white flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Start a Conversation:</span>
                </p>
                <div>
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none mb-1.5"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (WhatsApp/Mobile) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none mb-1.5"
                  />
                  <input
                    type="email"
                    placeholder="Email (Optional)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((m) => {
              const isCustomer = m.sender === 'customer';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      isCustomer
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#aa771c] text-black rounded-tr-sm font-medium shadow-md'
                        : 'bg-[#18181b] border border-[#d4af37]/30 text-white rounded-tl-sm'
                    }`}
                  >
                    {!isCustomer && (
                      <p className="text-[10px] text-[#d4af37] font-bold mb-1 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" /> SOG Official Concierge
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                  <span className="text-[9px] text-[#71717a] mt-1 px-1 flex items-center gap-1 font-mono">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isCustomer && <CheckCheck className="w-2.5 h-2.5 text-[#d4af37]" />}
                  </span>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#121215] border-t border-[#27272a] flex items-center gap-2">
            <input
              type="text"
              placeholder={!conversationId ? "Fill details above, then write your inquiry..." : "Type your message to SOG..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs focus:border-[#d4af37] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim() || (!conversationId && (!customerName.trim() || !customerPhone.trim()))}
              className="p-2.5 rounded-xl gold-gradient-bg text-black hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-md"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
