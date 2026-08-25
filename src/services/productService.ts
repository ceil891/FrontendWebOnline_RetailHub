import { fetchApi } from './api';
import { Product, Category } from '../types';

export function getLocalStockOverrides(): Record<string, number> {
  try {
    const saved = localStorage.getItem('user_product_stocks');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return {};
}

export function saveLocalStockDeduction(productId: string | number, quantity: number, initialStock: number = 18) {
  try {
    const key = String(productId);
    const overrides = getLocalStockOverrides();
    const existingStock = overrides[key] !== undefined ? overrides[key] : initialStock;
    const newStock = Math.max(0, existingStock - quantity);
    overrides[key] = newStock;
    localStorage.setItem('user_product_stocks', JSON.stringify(overrides));
  } catch (err) {
    console.warn('Failed to save local stock deduction:', err);
  }
}

export function restoreLocalStock(productId: string | number, quantity: number) {
  try {
    const key = String(productId);
    const overrides = getLocalStockOverrides();
    if (overrides[key] !== undefined) {
      overrides[key] = overrides[key] + quantity;
      localStorage.setItem('user_product_stocks', JSON.stringify(overrides));
    }
  } catch {}
}

export function applyStockOverridesToProduct(product: Product): Product {
  const overrides = getLocalStockOverrides();
  const key = String(product.id);
  if (overrides[key] !== undefined) {
    const count = Number(overrides[key]);
    return {
      ...product,
      stockCount: count,
      inStock: count > 0
    };
  }
  return product;
}

function getCategoryFallbackImage(name: string = '', categoryName: string = ''): string {
  const text = (name + ' ' + categoryName).toLowerCase();
  if (text.includes('coca') || text.includes('nước') || text.includes('giải khát') || text.includes('pepsi') || text.includes('lon') || text.includes('chai') || text.includes('bia') || text.includes('đồ uống')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80';
  }
  if (text.includes('áo') || text.includes('quần') || text.includes('thời trang') || text.includes('giày') || text.includes('nike') || text.includes('mũ')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80';
  }
  if (text.includes('bánh') || text.includes('kẹo') || text.includes('thực phẩm') || text.includes('ăn') || text.includes('gà')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
}

export const productService = {
  async getProducts(params?: { search?: string; categoryId?: string; isActive?: boolean }): Promise<Product[]> {
    let rawList: Product[] = [];

    try {
      const query = new URLSearchParams();
      query.append('isActive', 'true');
      if (params?.search) query.append('search', params.search);

      const data = await fetchApi<any>(`/products?${query.toString()}`);
      const items = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);

      if (items && items.length > 0) {
        rawList = items.map((item: any) => {
          const imgList = [];
          if (item.mainImageUrl) imgList.push(item.mainImageUrl);
          if (item.galleryImages) {
            try {
              const gallery = typeof item.galleryImages === 'string' ? JSON.parse(item.galleryImages) : item.galleryImages;
              if (Array.isArray(gallery)) imgList.push(...gallery);
            } catch {
              if (typeof item.galleryImages === 'string') imgList.push(item.galleryImages);
            }
          }
          if (imgList.length === 0) {
            const nameStr = item.name || item.productName || '';
            const catStr = item.categoryName || item.category || '';
            imgList.push(getCategoryFallbackImage(nameStr, catStr));
          }

          const price = Number(item.basePrice ?? item.price ?? item.sellingPrice ?? 0);

          return {
            id: String(item.id),
            name: item.name || item.productName || 'Sản phẩm',
            brand: item.brand || 'Chính hãng',
            category: item.categoryName || item.category || 'Danh mục sản phẩm',
            categoryId: String(item.categoryId || item.category?.id || item.id || ''),
            price: price,
            originalPrice: item.originalPrice ? Number(item.originalPrice) : Math.round(price * 1.2),
            discountPercent: item.discountPercent || 0,
            rating: item.rating || 5.0,
            reviewCount: item.reviewCount || 0,
            images: imgList,
            inStock: item.isActive !== false,
            stockCount: Number(item.stockCount ?? item.reorderPoint ?? 18),
            description: item.description || 'Sản phẩm chính hãng.',
            specifications: item.specifications || { 'Thương hiệu': item.brand || 'Chính hãng', 'Mã sản phẩm': item.productCode || String(item.id) },
            colors: item.colors || [{ name: 'Mặc định', hex: '#0f172a' }],
            sizes: item.sizes || ['Tiêu chuẩn'],
            isFeatured: true,
            isBestSeller: true,
            isNew: true,
            isFlashSale: false
          };
        });
      }
    } catch (err) {
      console.warn('API /products failed:', err);
      rawList = [];
    }

    return rawList.map(p => applyStockOverridesToProduct(p));
  },

  async getProductById(id: string): Promise<Product | null> {
    let p: Product | null = null;

    try {
      const item = await fetchApi<any>(`/products/${id}`);
      if (item) {
        const imgList = [];
        if (item.mainImageUrl) imgList.push(item.mainImageUrl);
        if (item.galleryImages) {
          try {
            const gallery = typeof item.galleryImages === 'string' ? JSON.parse(item.galleryImages) : item.galleryImages;
            if (Array.isArray(gallery)) imgList.push(...gallery);
          } catch {
            if (typeof item.galleryImages === 'string') imgList.push(item.galleryImages);
          }
        }
        if (imgList.length === 0) {
          imgList.push(getCategoryFallbackImage(item.name || '', item.categoryName || item.category || ''));
        }

        const price = Number(item.basePrice ?? item.price ?? item.sellingPrice ?? 0);

        p = {
          id: String(item.id),
          name: item.name,
          brand: item.brand || 'Chính hãng',
          category: item.categoryName || 'Danh mục sản phẩm',
          price: price,
          originalPrice: item.originalPrice ? Number(item.originalPrice) : Math.round(price * 1.2),
          discountPercent: item.discountPercent || 0,
          rating: item.rating || 5.0,
          reviewCount: item.reviewCount || 0,
          images: imgList,
          inStock: item.isActive !== false,
          stockCount: Number(item.stockCount ?? item.maxStock ?? item.reorderPoint ?? 18),
          description: item.description || '',
          specifications: item.specifications || { 'Thương hiệu': item.brand || 'Chính hãng', 'Mã sản phẩm': item.productCode || String(item.id) },
          colors: item.colors || [{ name: 'Mặc định', hex: '#0f172a' }],
          sizes: item.sizes || ['Tiêu chuẩn']
        };
      }
    } catch (err) {
      console.warn(`API /products/${id} failed:`, err);
    }

    if (p) {
      return applyStockOverridesToProduct(p);
    }
    return null;
  },

  async getCategories(): Promise<Category[]> {
    try {
      const data = await fetchApi<any>('/categories');
      const items = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
      if (items && items.length > 0) {
        return items.map((c: any) => ({
          id: String(c.id),
          name: c.categoryName || c.name,
          iconName: c.icon || 'Category',
          image: c.imageUrl || c.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
          itemCount: c.productCount || 0
        }));
      }
      return [];
    } catch (err) {
      console.error('API /categories failed:', err);
      return [];
    }
  }
};
