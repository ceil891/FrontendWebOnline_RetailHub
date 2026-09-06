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

  async submitProductReview(
    productId: number | string,
    data: { rating: number; comment: string; customerName?: string; customerId?: number; productName?: string; productImage?: string; productPrice?: number }
  ): Promise<ProductReviewItem | null> {
    const newRevItem: ProductReviewItem = {
      id: Date.now(),
      productId: Number(productId),
      customerId: data.customerId,
      customerName: data.customerName || 'Khách hàng',
      rating: data.rating,
      comment: data.comment,
      isApproved: true,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      productName: data.productName,
      productImage: data.productImage,
      productPrice: data.productPrice,
    };

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
      if (resData?.id) newRevItem.id = resData.id;
    } catch (err) {
      console.warn(`Failed to submit review for product ${productId}:`, err);
    }

    // Always persist into user_my_reviews in localStorage
    try {
      const stored = localStorage.getItem('user_my_reviews');
      const list: ProductReviewItem[] = stored ? JSON.parse(stored) : [];
      list.unshift(newRevItem);
      localStorage.setItem('user_my_reviews', JSON.stringify(list));
      window.dispatchEvent(new Event('reviews_updated'));
    } catch {}

    return newRevItem;
  },

  async getCustomerReviews(customerId?: number, customerName?: string): Promise<ProductReviewItem[]> {
    let apiList: ProductReviewItem[] = [];
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', String(customerId));
      if (customerName) params.append('customerName', customerName);

      const res = await fetchApi<any>(`/reviews/customer?${params.toString()}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      apiList = list.map((r: any) => ({
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
      console.warn('Failed to fetch customer reviews from API:', err);
    }

    // Merge with local reviews
    try {
      const stored = localStorage.getItem('user_my_reviews');
      const localList: ProductReviewItem[] = stored ? JSON.parse(stored) : [];
      const combined = [...localList];
      apiList.forEach((apiItem) => {
        if (!combined.some((c) => String(c.id) === String(apiItem.id) || (c.productId === apiItem.productId && c.comment === apiItem.comment))) {
          combined.push(apiItem);
        }
      });
      return combined;
    } catch {
      return apiList;
    }
  }
};
