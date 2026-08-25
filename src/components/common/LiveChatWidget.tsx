import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Headphones, Bot, ShieldCheck, Sparkles } from 'lucide-react';
import { chatService, ChatMessage, SupportTicket } from '../../services/chatService';
import { authService } from '../../services/authService';

export const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authService.getCurrentUser();

  const customerName = currentUser?.name || 'Khách hàng Online';
  const customerPhone = currentUser?.phone || '0988 123 456';

  // Initialize or fetch ticket when user opens chat
  useEffect(() => {
    if (isOpen && !ticket) {
      chatService.getOrCreateCustomerTicket(customerName, customerPhone).then(t => {
        setTicket(t);
        chatService.getMessages(t.id).then(msgs => {
          setMessages(msgs);
        });
      });
    }
  }, [isOpen, customerName, customerPhone, ticket]);

  // Polling for new messages from Admin when chat is open
  useEffect(() => {
    if (!isOpen || !ticket) return;

    const fetchLatest = async () => {
      try {
        const msgs = await chatService.getMessages(ticket.id);
        if (msgs && msgs.length > 0) {
          setMessages(msgs);
        }
      } catch { }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 2500);

    return () => clearInterval(interval);
  }, [isOpen, ticket]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    let activeTicket = ticket;
    if (!activeTicket) {
      activeTicket = await chatService.getOrCreateCustomerTicket(customerName, customerPhone);
      setTicket(activeTicket);
    }

    const sent = await chatService.sendMessage(activeTicket.id, text, customerName);
    if (sent) {
      if (sent.ticketId && String(sent.ticketId) !== String(activeTicket.id)) {
        activeTicket = { ...activeTicket, id: sent.ticketId };
        setTicket(activeTicket);
        sessionStorage.setItem('active_chat_ticket_id', String(sent.ticketId));
      }
      setMessages(prev => [...prev, sent]);
    }
    setIsSending(false);
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* 1. CHAT TOGGLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setUnreadCount(0); }}
          className="group relative flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
          aria-label="Mở khung chat hỗ trợ trực tiếp"
        >
          <div className="relative">
            <Headphones size={22} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-xs font-black block tracking-wide">Hỗ trợ CSKH 24/7</span>
            <span className="text-[10px] text-slate-300 block">Chat trực tiếp Admin</span>
          </div>

          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* 2. CHAT POPUP WINDOW */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-sky-400 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <Headphones size={18} className="text-amber-300" />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
              </div>
              <div>
                <h4 className="text-xs font-black flex items-center gap-1.5">
                  RetailHub Support <ShieldCheck size={14} className="text-sky-400" />
                </h4>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Đang trực tuyến • Sẵn sàng phản hồi
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick FAQ Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => handleQuickQuestion('Tư vấn kiểm tra đơn hàng')}
              className="shrink-0 px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold rounded-full shadow-xs transition-colors"
            >
              📦 Kiểm tra đơn hàng
            </button>
            <button
              onClick={() => handleQuickQuestion('Mã voucher giảm giá hôm nay')}
              className="shrink-0 px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold rounded-full shadow-xs transition-colors"
            >
              🎟️ Voucher ưu đãi
            </button>
            <button
              onClick={() => handleQuickQuestion('Chính sách giao hàng & bảo hành')}
              className="shrink-0 px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold rounded-full shadow-xs transition-colors"
            >
              🛡️ Đổi trả 7 ngày
            </button>
          </div>

          {/* Message History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Bot size={36} className="text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Bắt đầu cuộc trò chuyện với tư vấn viên RetailHub</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isStaff ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-1 px-1">
                    {msg.senderName} • {msg.createdAt}
                  </span>
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs shadow-sm leading-relaxed ${
                      msg.isStaff
                        ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-sm'
                        : 'bg-slate-900 text-white rounded-tr-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập nội dung cần hỗ trợ..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-900 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-2xl transition-transform active:scale-95 shadow-sm"
              title="Gửi tin nhắn"
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
