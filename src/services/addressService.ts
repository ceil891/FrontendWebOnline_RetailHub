import { fetchApi } from './api';

export interface CustomerAddress {
  id: string | number;
  customerId?: number;
  customerPhone?: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward?: string;
  street: string;
  fullAddress: string;
  addressType: 'HOME' | 'OFFICE' | 'OTHER';
  isDefault: boolean;
  notes?: string;
}

export const addressService = {
  async getAddresses(customerId?: number, phone?: string): Promise<CustomerAddress[]> {
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', String(customerId));
      if (phone) params.append('phone', phone.replace(/\s+/g, ''));

      const res = await fetchApi<any>(`/customer-addresses?${params.toString()}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      
      if (list.length > 0) {
        localStorage.setItem('user_addresses', JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('API /customer-addresses GET failed, fallback to local storage:', err);
    }

    // LocalStorage fallback
    const saved = localStorage.getItem('user_addresses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { }
    }

    return [
      {
        id: '1',
        recipientName: 'Nguyễn Lưu Hưng',
        phoneNumber: phone || '0988 123 456',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        street: '123 Nguyễn Trãi, Phường Bến Thành',
        fullAddress: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
        addressType: 'HOME',
        isDefault: true,
      }
    ];
  },

  async createAddress(data: Partial<CustomerAddress>): Promise<CustomerAddress | null> {
    try {
      const res = await fetchApi<any>('/customer-addresses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const created = res?.data || res;
      return created;
    } catch (err) {
      console.warn('API /customer-addresses POST failed:', err);
      // Fallback local creation
      const localId = Date.now().toString();
      const fullAddr = data.fullAddress || `${data.street}, ${data.district}, ${data.province}`;
      const localAddr: CustomerAddress = {
        id: localId,
        recipientName: data.recipientName || 'Khách hàng Online',
        phoneNumber: data.phoneNumber || '0988 123 456',
        province: data.province || 'TP. Hồ Chí Minh',
        district: data.district || 'Quận 1',
        street: data.street || '',
        fullAddress: fullAddr,
        addressType: data.addressType || 'HOME',
        isDefault: Boolean(data.isDefault),
      };
      return localAddr;
    }
  },

  async updateAddress(id: string | number, data: Partial<CustomerAddress>): Promise<CustomerAddress | null> {
    try {
      const res = await fetchApi<any>(`/customer-addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res?.data || res;
    } catch (err) {
      console.warn(`API /customer-addresses/${id} PUT failed:`, err);
      return null;
    }
  },

  async deleteAddress(id: string | number): Promise<boolean> {
    try {
      await fetchApi<any>(`/customer-addresses/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.warn(`API /customer-addresses/${id} DELETE failed:`, err);
      return false;
    }
  },

  async setDefaultAddress(id: string | number, customerId?: number, phone?: string): Promise<CustomerAddress | null> {
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', String(customerId));
      if (phone) params.append('phone', phone);

      const res = await fetchApi<any>(`/customer-addresses/${id}/default?${params.toString()}`, {
        method: 'PATCH',
      });
      return res?.data || res;
    } catch (err) {
      console.warn(`API /customer-addresses/${id}/default PATCH failed:`, err);
      return null;
    }
  }
};
