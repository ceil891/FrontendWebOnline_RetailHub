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
  async getOrCreateCustomerTicket(customerName: string, customerPhone = '', customerEmail = ''): Promise<SupportTicket> {
    try {
      const resolvedName = customerName?.trim() || 'Khách hàng vãng lai';
      const savedTicketId = sessionStorage.getItem('active_chat_ticket_id');
      if (savedTicketId) {
        // Guests only retain their session ticket; never request the protected ticket list.
        return {
          id: savedTicketId,
          ticketCode: `TCK-${savedTicketId}`,
          title: `Tư vấn & Hỗ trợ: ${resolvedName}`,
          priority: 'HIGH', status: 'OPEN', customerName: resolvedName, customerPhone,
        };
      }
      const newTicketPayload = {
        ticketCode: `ONLINE-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `[Live Chat] Tư vấn & Hỗ trợ: ${resolvedName}`,
        subject: `[Live Chat] Tư vấn & Hỗ trợ: ${resolvedName}`,
        priority: 'HIGH',
        status: 'OPEN',
        customerName: resolvedName,
        customerPhone: customerPhone,
        customerEmail,
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
        customerName: resData.customerName || resolvedName,
        customerPhone: customerPhone,
      };
    } catch (err) {
      console.warn('Failed to get/create ticket via API:', err);
      // Generate temporary ticket identifier matching customer
      const fallbackCode = `ONLINE-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: String(Date.now()),
        ticketCode: fallbackCode,
        title: `[Live Chat] Tư vấn: ${customerName || 'Khách hàng vãng lai'}`,
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
      
      const filtered = list.filter((m: any) => 
        String(m.ticketId) === String(ticketId) || 
        (m.ticketCode && String(m.ticketCode) === String(ticketId)) ||
        (ticketId && String(ticketId).includes('-') && m.ticketCode && String(m.ticketCode).toLowerCase() === String(ticketId).toLowerCase())
      );
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

  async sendMessage(ticketId: string | number, message: string, customerName: string, senderPhone = '', senderEmail = ''): Promise<ChatMessage | null> {
    try {
      const payload = {
        ticketId: String(ticketId),
        message: message,
        isStaff: false,
        senderName: customerName || 'Khách hàng vãng lai',
        ...(senderPhone ? { senderPhone } : {}),
        ...(senderEmail ? { senderEmail } : {}),
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
        senderName: resData.senderName || customerName || 'Khách hàng vãng lai',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (err) {
      console.warn('API /crm/ticket-messages POST failed:', err);
      return {
        id: String(Date.now()),
        ticketId: ticketId,
        message: message,
        isStaff: false,
        senderName: customerName || 'Khách hàng vãng lai',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }
};
