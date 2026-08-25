import { fetchApi } from './api';

export interface CustomerProfile {
  id?: number;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  points?: number;
  membershipRank?: string;
  totalSpend?: number;
}

export const customerService = {
  async getProfile(id?: number, email?: string, phone?: string): Promise<CustomerProfile | null> {
    try {
      // If email or phone provided, search customer matching this user
      if (email || phone) {
        const query = email ? `keyword=${encodeURIComponent(email)}` : `keyword=${encodeURIComponent(phone || '')}`;
        const searchRes = await fetchApi<any>(`/partnerarea/customers?${query}`);
        const list = Array.isArray(searchRes) ? searchRes : (Array.isArray(searchRes?.content) ? searchRes.content : (Array.isArray(searchRes?.data) ? searchRes.data : []));
        
        const matched = list.find((c: any) => {
          const cEmail = (c.email || '').toLowerCase().trim();
          const cPhone = (c.phone || c.phoneNumber || '').replace(/\s+/g, '');
          const myEmail = (email || '').toLowerCase().trim();
          const myPhone = (phone || '').replace(/\s+/g, '');
          return (myEmail && cEmail === myEmail) || (myPhone && cPhone === myPhone);
        });

        if (matched) {
          return {
            id: matched.id,
            fullName: matched.name || matched.customerName || matched.fullName,
            phone: matched.phone || matched.phoneNumber || '',
            email: matched.email || '',
            address: matched.address || '',
            points: matched.points !== undefined ? Number(matched.points) : 0,
            membershipRank: matched.membershipRank || 'Đồng',
            totalSpend: matched.totalSpend !== undefined ? Number(matched.totalSpend) : 0,
          };
        }
      }

      // If id is provided and no email/phone mismatch
      if (id) {
        const res = await fetchApi<any>(`/partnerarea/customers/${id}`);
        if (res) {
          return {
            id: res.id,
            fullName: res.name || res.customerName || res.fullName || 'Khách hàng',
            phone: res.phone || res.phoneNumber || '',
            email: res.email || '',
            address: res.address || '',
            points: res.points !== undefined ? Number(res.points) : 0,
            membershipRank: res.membershipRank || 'Đồng',
            totalSpend: res.totalSpend !== undefined ? Number(res.totalSpend) : 0,
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('API /partnerarea/customers failed:', err);
      return null;
    }
  },

  async updateProfile(id: number, data: CustomerProfile): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('customerName', data.fullName);
      formData.append('phoneNumber', data.phone);
      if (data.email) formData.append('email', data.email);
      if (data.address) formData.append('address', data.address);

      await fetchApi<any>(`/partnerarea/customers/${id}`, {
        method: 'PUT',
        body: formData,
      });
      return true;
    } catch (err) {
      console.warn('API /partnerarea/customers PUT failed:', err);
      return false;
    }
  },

  async getCustomerVouchers(customerId: number): Promise<any[]> {
    try {
      const res = await fetchApi<any[]>('/crm/customer-vouchers');
      if (res && Array.isArray(res)) {
        return res.filter(
          (cv: any) => String(cv.customerId) === String(customerId) && cv.status === 'ACTIVE'
        );
      }
      return [];
    } catch (err) {
      console.warn('API /crm/customer-vouchers GET failed:', err);
      return [];
    }
  }
};
