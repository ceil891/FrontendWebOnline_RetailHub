import { fetchApi } from './api';

export interface CustomerProfile {
  id?: number;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  dob?: string;
  gender?: string;
  avatarUrl?: string;
  avatar?: File | string;
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
            fullName: matched.name || matched.customerName || matched.fullName || 'Khách hàng',
            phone: matched.phone || matched.phoneNumber || '',
            email: matched.email || '',
            address: matched.address || '',
            dob: matched.dob || '',
            gender: matched.gender || '',
            avatarUrl: matched.avatarUrl || matched.avatar || '',
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
            dob: res.dob || '',
            gender: res.gender || '',
            avatarUrl: res.avatarUrl || res.avatar || '',
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
      formData.append('name', data.fullName);
      formData.append('customerName', data.fullName);
      formData.append('phone', data.phone);
      formData.append('phoneNumber', data.phone);
      if (data.email) formData.append('email', data.email);
      if (data.address) formData.append('address', data.address);
      if (data.dob) formData.append('dob', data.dob);
      if (data.gender) formData.append('gender', data.gender);
      if (data.avatarUrl) formData.append('avatarUrl', data.avatarUrl);
      if (data.avatar instanceof File) {
        formData.append('avatar', data.avatar);
      }

      await fetchApi<any>(`/partnerarea/customers/${id}`, {
        method: 'PUT',
        body: formData,
      });

      // Synchronize into localStorage user_info & user_profile
      const savedUserStr = localStorage.getItem('user_info');
      const currentUser = savedUserStr ? JSON.parse(savedUserStr) : {};
      const updatedUser = {
        ...currentUser,
        name: data.fullName,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || currentUser.email,
        dob: data.dob || currentUser.dob,
        avatar: data.avatarUrl || currentUser.avatar,
        avatarUrl: data.avatarUrl || currentUser.avatarUrl,
      };
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      localStorage.setItem('user_profile', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth_changed'));

      return true;
    } catch (err) {
      console.warn('API /partnerarea/customers PUT failed, falling back to local sync:', err);
      const savedUserStr = localStorage.getItem('user_info');
      const currentUser = savedUserStr ? JSON.parse(savedUserStr) : {};
      const updatedUser = {
        ...currentUser,
        name: data.fullName,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || currentUser.email,
        dob: data.dob || currentUser.dob,
        avatar: data.avatarUrl || currentUser.avatar,
        avatarUrl: data.avatarUrl || currentUser.avatarUrl,
      };
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      localStorage.setItem('user_profile', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth_changed'));
      return true;
    }
  },

  async getCustomerVouchers(customerId?: number, phone?: string): Promise<any[]> {
    try {
      const res = await fetchApi<any[]>('/crm/customer-vouchers');
      const list = Array.isArray(res) ? res : ((res as any)?.data || []);
      if (list && Array.isArray(list)) {
        const cleanPhone = (phone || '').replace(/\s+/g, '');
        return list.filter((cv: any) => {
          const cvPhone = (cv.customerPhone || cv.phone || '').replace(/\s+/g, '');
          const matchId = customerId && (String(cv.customerId) === String(customerId) || String(cv.customer?.id) === String(customerId));
          const matchPhone = cleanPhone && cvPhone && cleanPhone === cvPhone;
          return (matchId || matchPhone) && cv.status !== 'DELETED';
        });
      }
      return [];
    } catch (err) {
      console.warn('API /crm/customer-vouchers GET failed:', err);
      return [];
    }
  }
};
