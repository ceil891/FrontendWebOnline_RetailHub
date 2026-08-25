import { fetchApi } from './api';

export interface ProductReviewItem {
  id: string | number;
  productId: number;
  customerId?: number;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  productName?: string;
  productCode?: string;
  productImage?: string;
  productPrice?: number;
}

export const reviewService = {
  async getProductReviews(productId: number | string): Promise<ProductReviewItem[]> {
    try {
      const res = await fetchApi<any>(`/products/${productId}/reviews`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      return list.map((r: any) => ({
        id: r.id,
        productId: Number(r.productId || productId),
        customerId: r.customerId,
        customerName: r.customerName || 'Khách hàng',
        rating: Number(r.rating || 5),
        comment: r.comment || '',
        isApproved: r.isApproved !== undefined ? Boolean(r.isApproved) : true,
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
        productName: r.productName,
        productImage: r.productImage,
        productPrice: r.productPrice,
      }));
    } catch (err) {
      console.warn(`Failed to fetch reviews for product ${productId}:`, err);
      return [];
    }
  },

  async submitProductReview(productId: number | string, data: { rating: number; comment: string; customerName?: string; customerId?: number }): Promise<ProductReviewItem | null> {
    try {
      const payload = {
        productId: Number(productId),
        rating: data.rating,
        comment: data.comment,
        customerName: data.customerName || 'Khách hàng',
        customerId: data.customerId,
        isApproved: true,
      };

      const res = await fetchApi<any>(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const resData = res?.data || res;
      return {
        id: resData.id || Date.now(),
        productId: Number(productId),
        customerName: resData.customerName || data.customerName || 'Khách hàng',
        rating: resData.rating || data.rating,
        comment: resData.comment || data.comment,
        isApproved: true,
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };
    } catch (err) {
      console.warn(`Failed to submit review for product ${productId}:`, err);
      return {
        id: Date.now(),
        productId: Number(productId),
        customerName: data.customerName || 'Khách hàng',
        rating: data.rating,
        comment: data.comment,
        isApproved: true,
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };
    }
  },

  async getCustomerReviews(customerId?: number, customerName?: string): Promise<ProductReviewItem[]> {
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', String(customerId));
      if (customerName) params.append('customerName', customerName);

      const res = await fetchApi<any>(`/reviews/customer?${params.toString()}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      return list.map((r: any) => ({
        id: r.id,
        productId: Number(r.productId || 1),
        customerId: r.customerId,
        customerName: r.customerName || 'Khách hàng',
        rating: Number(r.rating || 5),
        comment: r.comment || '',
        isApproved: r.isApproved !== undefined ? Boolean(r.isApproved) : true,
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
        productName: r.productName || 'Sản phẩm đã mua',
        productCode: r.productCode,
        productImage: r.productImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        productPrice: r.productPrice || 0,
      }));
    } catch (err) {
      console.warn('Failed to fetch customer reviews:', err);
      return [];
    }
  }
};
