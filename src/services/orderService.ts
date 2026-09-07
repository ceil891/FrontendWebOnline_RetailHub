import { fetchApi } from './api';
import { Order } from '../types';
import { saveLocalStockDeduction } from './productService';
import { authService } from './authService';
import { formatDateTime } from '../utils/formatters';

// Automatically clean up old local storage mock orders
try {
  localStorage.removeItem('user_local_orders');
} catch { }

function resolveItemImage(d: any): string {
  if (d.imageUrl && !d.imageUrl.includes('placeholder')) return d.imageUrl;
  if (d.image && !d.image.includes('placeholder')) return d.image;

  const dName = (d.productNameSnapshot || d.productName || '').toLowerCase();

  if (dName.includes('macbook') || dName.includes('laptop') || dName.includes('dell') || dName.includes('asus') || dName.includes('thinkpad')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
  }
  if (dName.includes('sony') || dName.includes('tai nghe') || dName.includes('headphone') || dName.includes('airpods')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
  }
  if (dName.includes('bàn phím') || dName.includes('keyboard') || dName.includes('keychron')) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80';
  }
  if (dName.includes('chuột') || dName.includes('mouse') || dName.includes('logitech')) {
    return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80';
  }
  if (dName.includes('iphone') || dName.includes('samsung') || dName.includes('điện thoại') || dName.includes('phone')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80';
  }
  if (dName.includes('đồng hồ') || dName.includes('watch') || dName.includes('apple watch')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
  }
  if (dName.includes('coca') || dName.includes('nước') || dName.includes('pepsi') || dName.includes('đồ uống')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80';
  }

  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
}

export const orderService = {
  // Helper to read user name from profile / auth
  getUserName(): string {
    try {
      const uProfile = localStorage.getItem('user_profile') || localStorage.getItem('user') || localStorage.getItem('auth_user') || localStorage.getItem('user_info');
      if (uProfile) {
        const parsed = JSON.parse(uProfile);
        if (parsed.fullName || parsed.name) return parsed.fullName || parsed.name;
      }
    } catch { }
    return 'Nguyễn Văn A';
  },

  async createOrder(orderPayload: any): Promise<any> {
    const orderCode = orderPayload.orderCode || `ONLINE-${Math.floor(100000 + Math.random() * 900000)}`;
    const defaultName = this.getUserName();
    const resolvedName = (!orderPayload.customerName || orderPayload.customerName === 'Khách hàng Online')
      ? defaultName
      : orderPayload.customerName;

    // Construct structured Order object for immediate order success page
    const localOrder: Order = {
      id: orderCode,
      date: formatDateTime(new Date()),
      status: 'pending',
      items: orderPayload.details ? orderPayload.details.map((d: any) => ({
        productId: String(d.productId || '1'),
        productName: d.productName || 'Sản phẩm mua Online',
        image: resolveItemImage(d),
        price: Number(d.unitPrice || d.price || 0),
        quantity: Number(d.quantity || 1)
      })) : [],
      subtotal: Number(orderPayload.subtotal || 0),
      discount: Number(orderPayload.discount || 0),
      shippingFee: Number(orderPayload.shippingFee || 30000),
      total: Number(orderPayload.total || orderPayload.totalAmount || 0),
      shippingAddress: {
        fullName: resolvedName,
        phone: orderPayload.customerPhone || '0988 123 456',
        street: orderPayload.shippingAddress || '123 Nguyễn Trãi, Quận 1',
        city: 'TP. Hồ Chí Minh',
        state: 'Quận 1',
        zip: '700000'
      },
      paymentMethod: orderPayload.paymentMethod || 'COD',
      trackingNumber: `VN-${orderCode}`
    };

    // Save to last_order so the OrderSuccessPage can display it immediately
    localStorage.setItem('last_order', JSON.stringify(localOrder));

    // Deduct stock persistently for each item in the order
    if (orderPayload.details && Array.isArray(orderPayload.details)) {
      orderPayload.details.forEach((d: any) => {
        const pId = String(d.productId || d.productVariantId || '1');
        const qty = Number(d.quantity || 1);
        saveLocalStockDeduction(pId, qty);
      });
    }

    try {
      const res = await fetchApi<any>('/sales/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
      return res || localOrder;
    } catch (err) {
      console.warn('API /sales/orders POST failed:', err);
      return localOrder;
    }
  },

  async cancelOrder(orderIdOrCode: string | number, reason?: string): Promise<boolean> {
    try {
      const data = await fetchApi<any>('/sales/orders').catch(() => null);
      const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
      const match = items.find((o: any) => String(o.id) === String(orderIdOrCode) || String(o.orderCode) === String(orderIdOrCode));
      const targetId = match?.id || orderIdOrCode;

      // 1. Gọi endpoint cancel dành riêng cho online (permitAll)
      try {
        const cancelUrl = `/online/orders/${targetId}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`;
        await fetchApi<any>(cancelUrl, { method: 'PUT' });
        return true;
      } catch {
        // Fallback gọi endpoint status thông thường
        await fetchApi<any>(`/sales/orders/${targetId}/status?status=CANCELLED`, {
          method: 'PUT',
        });
        return true;
      }
    } catch (err) {
      console.warn('API /sales/orders cancel failed:', err);
      return false;
    }
  },

  async getOrders(): Promise<Order[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    try {
      const data = await fetchApi<any>('/sales/orders');
      const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
      
      const apiOrders: Order[] = items
        .filter((item: any) => {
          // Lọc đúng đơn hàng của user đang đăng nhập
          const uPhone = (currentUser.phone || '').replace(/\s+/g, '');
          const uName = (currentUser.name || '').trim().toLowerCase();
          const uEmail = (currentUser.email || '').trim().toLowerCase();

          const ordPhone = (item.customerPhone || '').replace(/\s+/g, '');
          const ordName = (item.customerName || '').trim().toLowerCase();
          const ordEmail = (item.customerEmail || item.email || '').trim().toLowerCase();

          const isMyPhone = Boolean(uPhone && ordPhone && uPhone === ordPhone);
          const isMyEmail = Boolean(uEmail && ordEmail && uEmail === ordEmail);
          const isMyName = Boolean(uName && ordName && (ordName === uName || ordName.includes(uName) || uName.includes(ordName)));

          if (!isMyPhone && !isMyEmail && !isMyName) {
            return false;
          }

          // Chỉ hiển thị đơn hàng Online, loại bỏ đơn POS tại cửa hàng
          const code = (item.orderCode || '').toUpperCase();
          const channel = (item.channel || item.type || item.saleChannel || item.orderType || '').toUpperCase();
          if (code.startsWith('ORD-POS') || channel === 'POS' || channel === 'IN_STORE') return false;
          return true;
        })
        .map((item: any) => {
          let st: Order['status'] = 'pending';
          const rawSt = (item.status || '').toUpperCase();
          if (rawSt === 'CONFIRMED' || rawSt === 'PROCESSING') st = 'processing';
          else if (rawSt === 'SHIPPED' || rawSt === 'DELIVERING') st = 'shipped';
          else if (rawSt === 'COMPLETED' || rawSt === 'DELIVERED') st = 'delivered';
          else if (rawSt === 'CANCELLED') st = 'cancelled';

          return {
            id: item.orderCode || `ONLINE-${item.id}`,
            date: formatDateTime(item.orderDate || item.createdAt),
            status: st,
            items: item.details ? item.details.map((d: any) => ({
              productId: String(d.productId || '1'),
              productName: d.productNameSnapshot || d.productName || 'Sản phẩm',
              image: resolveItemImage(d),
              price: Number(d.unitPriceSnapshot || d.unitPrice || d.price || 0),
              quantity: Number(d.quantity || 1)
            })) : [],
            subtotal: Number(item.subtotal || item.totalAmount || 0),
            discount: Number(item.discountAmount || 0),
            shippingFee: Number(item.shippingFee || 30000),
            total: Number(item.totalAmount || 0),
            shippingAddress: {
              fullName: item.customerName || 'Khách hàng Online',
              phone: item.customerPhone || '0988 123 456',
              street: item.shippingAddress || 'Việt Nam',
              city: 'TP. Hồ Chí Minh',
              state: 'Quận 1',
              zip: '700000'
            },
            paymentMethod: item.paymentMethod || 'COD',
            branchId: item.branchId || item.branch?.id,
            branchName: item.branchName || item.branch?.branchName,
            trackingNumber: item.trackingCode || `TRK-${item.orderCode || item.id}`,
            trackingUrl: item.trackingUrl,
            carrier: item.carrier,
            shipperName: item.shipperName,
            shipperPhone: item.shipperPhone,
            deliveryStatus: item.deliveryStatus,
            assignedAt: item.assignedAt
          };
        });

      return apiOrders;
    } catch (err) {
      console.warn('API /sales/orders GET failed:', err);
      return [];
    }
  }
};
