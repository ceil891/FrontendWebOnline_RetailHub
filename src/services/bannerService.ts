import { fetchApi } from './api';
import { Banner } from '../types';

const DEFAULT_BANNERS: Banner[] = [
  {
    id: '1',
    title: 'Lễ hội Công nghệ AuraMart 2026 - Giảm tới 50%',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/listing',
    sortOrder: 1,
    isActive: true
  },
  {
    id: '2',
    title: 'Bộ Sưu Tập Giày Sneaker & Thời Trang Chính Hãng',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/listing',
    sortOrder: 2,
    isActive: true
  },
  {
    id: '3',
    title: 'Đồng Hồ & Thiết Bị Đeo Thông Minh Thế Hệ Mới',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/listing',
    sortOrder: 3,
    isActive: true
  }
];

export const bannerService = {
  async getActiveBanners(): Promise<Banner[]> {
    try {
      const data = await fetchApi<any>('/banners?activeOnly=true');
      const items = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : (Array.isArray(data?.data) ? data.data : []));
      
      if (Array.isArray(items) && items.length > 0) {
        return items
          .filter((item: any) => item.isActive !== false)
          .map((item: any) => ({
            id: String(item.id),
            title: item.title || '',
            imageUrl: item.imageUrl || '',
            linkUrl: item.linkUrl || '',
            sortOrder: Number(item.sortOrder || 0),
            isActive: Boolean(item.isActive !== false),
            validFrom: item.validFrom || '',
            validUntil: item.validUntil || ''
          }))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      return DEFAULT_BANNERS;
    } catch (err) {
      console.warn('API /banners?activeOnly=true fallback to default:', err);
      return DEFAULT_BANNERS;
    }
  }
};

