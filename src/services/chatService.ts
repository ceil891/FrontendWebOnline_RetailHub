import { fetchApi } from './api';

export interface ChatMessage {
  id: string | number;
  ticketId: string | number;
  message: string;
  isStaff: boolean;
  senderName: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string | number;
  ticketCode: string;
  title: string;
  priority: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  createdDate?: string;
}

export const chatService = {
  async getOrCreateCustomerTicket(customerName: string, customerPhone: string): Promise<SupportTicket> {
    try {
      // 1. Check session storage for existing ticket in this session
      const savedTicketId = sessionStorage.getItem('active_chat_ticket_id');
      const ticketsRes = await fetchApi<any>('/crm/tickets');
      const list: any[] = Array.isArray(ticketsRes) ? ticketsRes : (Array.isArray(ticketsRes?.data) ? ticketsRes.data : []);

      if (savedTicketId) {
        const found = list.find((t: any) => String(t.id) === String(savedTicketId));
        if (found) {
          return {
            id: found.id,
            ticketCode: found.ticketCode || `TCK-${found.id}`,
            title: found.title || found.subject || 'Hỗ trợ khách hàng Online',
            priority: found.priority || 'MEDIUM',
            status: found.status || 'OPEN',
            customerName: found.customerName || customerName,
            customerPhone: found.customerPhone || customerPhone,
          };
        }
      }

      const cleanPhone = (customerPhone || '').replace(/\s+/g, '');
      const cleanName = (customerName || '').trim().toLowerCase();

      // 2. Find active ticket for this customer
      const existing = list.find((t: any) => {
        const tPhone = (t.customerPhone || '').replace(/\s+/g, '');
        const tName = (t.customerName || '').trim().toLowerCase();
        const isOpen = t.status !== 'CLOSED' && t.status !== 'RESOLVED';
        return isOpen && ((cleanPhone && tPhone === cleanPhone) || (cleanName && tName === cleanName));
      });

      if (existing) {
        sessionStorage.setItem('active_chat_ticket_id', String(existing.id));
        return {
          id: existing.id,
          ticketCode: existing.ticketCode || `TCK-${existing.id}`,
          title: existing.title || existing.subject || 'Hỗ trợ khách hàng Online',
          priority: existing.priority || 'MEDIUM',
          status: existing.status || 'OPEN',
          customerName: existing.customerName || customerName,
          customerPhone: existing.customerPhone || customerPhone,
        };
      }

      // 3. Create new ticket for customer
      const newTicketPayload = {
        ticketCode: `ONLINE-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `[Khách Web Online] Tư vấn & Hỗ trợ: ${customerName}`,
        subject: `[Khách Web Online] Tư vấn & Hỗ trợ: ${customerName}`,
        priority: 'HIGH',
        status: 'OPEN',
        customerName: customerName,
        customerPhone: customerPhone,
      };

      const created = await fetchApi<any>('/crm/tickets', {
        method: 'POST',
        body: JSON.stringify(newTicketPayload),
      });

      const resData = created?.data || created;
      const newTicketId = String(resData.id || Date.now());
      sessionStorage.setItem('active_chat_ticket_id', newTicketId);

      return {
        id: newTicketId,
        ticketCode: resData.ticketCode || newTicketPayload.ticketCode,
        title: resData.title || newTicketPayload.title,
        priority: resData.priority || 'HIGH',
        status: resData.status || 'OPEN',
        customerName: customerName,
        customerPhone: customerPhone,
      };
    } catch (err) {
      console.warn('Failed to get/create ticket via API:', err);
      // Generate temporary ticket identifier matching customer
      const fallbackCode = `ONLINE-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: String(Date.now()),
        ticketCode: fallbackCode,
        title: `[Khách Web Online] Tư vấn: ${customerName}`,
        priority: 'HIGH',
        status: 'OPEN',
        customerName: customerName,
        customerPhone: customerPhone,
      };
    }
  },

  async getMessages(ticketId: string | number): Promise<ChatMessage[]> {
    try {
      const res = await fetchApi<any>(`/crm/ticket-messages?ticketId=${ticketId}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      
      const filtered = list.filter((m: any) => String(m.ticketId) === String(ticketId));
      return filtered.map((m: any) => {
        let timeDisplay = m.createdAt || '';
        if (timeDisplay && timeDisplay.includes(' ')) {
          timeDisplay = timeDisplay.split(' ')[1].substring(0, 5);
        } else if (timeDisplay && timeDisplay.includes('T')) {
          timeDisplay = timeDisplay.split('T')[1].substring(0, 5);
        }
        return {
          id: m.id,
          ticketId: m.ticketId,
          message: m.message || '',
          isStaff: Boolean(m.isStaff),
          senderName: m.senderName || (m.isStaff ? 'Nhân viên CSKH' : 'Bạn'),
          createdAt: timeDisplay || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
      });
    } catch (err) {
      console.warn('API /crm/ticket-messages GET failed:', err);
      return [];
    }
  },

  async sendMessage(ticketId: string | number, message: string, customerName: string): Promise<ChatMessage | null> {
    try {
      const payload = {
        ticketId: String(ticketId),
        message: message,
        isStaff: false,
        senderName: customerName || 'Khách hàng Online',
      };

      const res = await fetchApi<any>(`/crm/support-tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const resData = res?.data || res;
      return {
        id: resData.id || String(Date.now()),
        ticketId: resData.ticketId || ticketId,
        message: message,
        isStaff: false,
        senderName: customerName || 'Bạn',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (err) {
      console.warn('API /crm/ticket-messages POST failed:', err);
      return {
        id: String(Date.now()),
        ticketId: ticketId,
        message: message,
        isStaff: false,
        senderName: customerName || 'Bạn',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }
};
