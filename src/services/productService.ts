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

export function getColorHex(colorName: string): string {
  const c = colorName.toLowerCase().trim();
  if (c.includes('đen') || c.includes('black') || c.includes('metallicblack') || c.includes('metallic black') || c.includes('dark')) return '#0f172a';
  if (c.includes('trắng') || c.includes('white')) return '#f8fafc';
  if (c.includes('xám bạc') || c.includes('xambac') || c.includes('xám') || c.includes('bạc') || c.includes('silver') || c.includes('grey') || c.includes('gray')) return '#94a3b8';
  if (c.includes('đỏ') || c.includes('red') || c.includes('ruby')) return '#ef4444';
  if (c.includes('xanh dương') || c.includes('blue') || c.includes('navy') || c.includes('cyan')) return '#3b82f6';
  if (c.includes('xanh lá') || c.includes('green') || c.includes('emerald') || c.includes('mint')) return '#10b981';
  if (c.includes('vàng') || c.includes('gold') || c.includes('yellow')) return '#f59e0b';
  if (c.includes('hồng') || c.includes('pink') || c.includes('rose')) return '#ec4899';
  if (c.includes('tím') || c.includes('purple') || c.includes('violet')) return '#8b5cf6';
  if (c.includes('cam') || c.includes('orange')) return '#f97316';
  if (c.includes('nâu') || c.includes('brown')) return '#78350f';
  return '#64748b';
}

export function parseProductVariants(item: any, catalogVariants?: any[]): {
  colors: { name: string; hex: string }[];
  sizes: string[];
  variantList: any[];
} {
  const colorsMap = new Map<string, { name: string; hex: string }>();
  const sizesSet = new Set<string>();
  const variantList: any[] = [];

  const addColor = (name: string, hex?: string) => {
    if (!name) return;
    const trimmed = String(name).trim();
    if (!trimmed) return;
    if (!colorsMap.has(trimmed)) {
      colorsMap.set(trimmed, { name: trimmed, hex: hex || getColorHex(trimmed) });
    }
  };

  const addSize = (name: string) => {
    if (!name) return;
    const trimmed = String(name).trim();
    if (trimmed) sizesSet.add(trimmed);
  };

  // Helper to extract from variant object list
  const processVariantsArray = (variants: any[]) => {
    if (!Array.isArray(variants) || variants.length === 0) return;
    variants.forEach(v => {
      variantList.push(v);
      let vColor = '';
      let vSize = '';

      if (Array.isArray(v.attributes)) {
        v.attributes.forEach((attr: any) => {
          const name = (attr.attributeName || attr.attributeCode || '').toUpperCase();
          if (name.includes('COLOR') || name.includes('MÀU')) {
            vColor = attr.value || '';
          } else if (name.includes('SIZE') || name.includes('KÍCH') || name.includes('PHIÊN')) {
            vSize = attr.value || '';
          }
        });
      }

      if ((!vColor || !vSize) && v.variantDescription) {
        const parts = v.variantDescription.split('|');
        parts.forEach((p: string) => {
          const trimmed = p.trim();
          if (trimmed.toLowerCase().includes('màu')) {
            vColor = vColor || trimmed.replace(/^màu\s*:\s*/i, '').trim();
          } else if (trimmed.toLowerCase().includes('size') || trimmed.toLowerCase().includes('kích thước') || trimmed.toLowerCase().includes('phiên bản')) {
            vSize = vSize || trimmed.replace(/^(size|kích thước|phiên bản)\s*:\s*/i, '').trim();
          }
        });
      }

      const skuOrCode = v.sku || v.variantCode || v.skuSuffix || v.variantName || v.name || v.code || '';
      if (skuOrCode) {
        const cleanSku = skuOrCode.startsWith('-') ? skuOrCode.substring(1) : skuOrCode;
        const parts = cleanSku.split('-').filter(Boolean);
        if (parts.length >= 2) {
          const colorCandidate = parts.length >= 3 ? parts[1] : parts[0];
          const sizeCandidate = parts.length >= 3 ? parts[2] : parts[1];
          if (!vColor && colorCandidate) {
            vColor = colorCandidate;
          }
          if (!vSize && sizeCandidate) {
            vSize = sizeCandidate;
          }
        } else if (parts.length === 1 && !vColor) {
          vColor = parts[0];
        }
      }

      if (v.colorName || v.color) addColor(v.colorName || v.color);
      if (v.sizeName || v.size) addSize(v.sizeName || v.size);
      if (vColor) addColor(vColor);
      if (vSize) addSize(vSize);
    });
  };

  // 1. Process from catalogVariants (GET /catalog/variants?productId=...)
  if (Array.isArray(catalogVariants) && catalogVariants.length > 0) {
    processVariantsArray(catalogVariants);
  }

  // 2. Process from item.variantList or item.productVariants
  if (Array.isArray(item?.variantList) && item.variantList.length > 0) {
    processVariantsArray(item.variantList);
  }
  if (Array.isArray(item?.productVariants) && item.productVariants.length > 0) {
    processVariantsArray(item.productVariants);
  }

  // 3. Process from item.variants (JSON string or object array)
  if (item?.variants) {
    try {
      const parsed = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
      if (Array.isArray(parsed)) {
        parsed.forEach((v: any) => {
          variantList.push(v);
          if (v.color || v.name) addColor(v.color || v.name, v.hex);
          if (v.size) addSize(v.size);
          if (v.skuSuffix) {
            const cleanSuffix = v.skuSuffix.startsWith('-') ? v.skuSuffix.substring(1) : v.skuSuffix;
            const parts = cleanSuffix.split('-').filter(Boolean);
            if (parts.length >= 2) {
              addColor(parts[0]);
              addSize(parts[1]);
            } else if (parts.length === 1) {
              addColor(parts[0]);
            }
          }
        });
      }
    } catch {}
  }

  // 4. Process direct item.colors and item.sizes
  if (Array.isArray(item?.colors) && item.colors.length > 0) {
    item.colors.forEach((c: any) => {
      if (typeof c === 'string') addColor(c);
      else if (c && c.name) addColor(c.name, c.hex);
    });
  }

  if (Array.isArray(item?.sizes) && item.sizes.length > 0) {
    item.sizes.forEach((s: any) => {
      if (typeof s === 'string') addSize(s);
    });
  }

  return {
    colors: Array.from(colorsMap.values()),
    sizes: Array.from(sizesSet.values()),
    variantList
  };
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
    let comboList: Product[] = [];

    try {
      const query = new URLSearchParams();
      query.append('isActive', 'true');
      if (params?.search) query.append('search', params.search);

      const [prodRes, comboRes] = await Promise.all([
        fetchApi<any>(`/products?${query.toString()}`).catch(err => {
          console.warn('API /products failed:', err);
          return [];
        }),
        fetchApi<any>('/catalog/combos').catch(err => {
          console.warn('API /catalog/combos failed:', err);
          return [];
        })
      ]);

      const items = Array.isArray(prodRes) ? prodRes : (Array.isArray(prodRes?.content) ? prodRes.content : (Array.isArray(prodRes?.data) ? prodRes.data : []));

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
          const { colors, sizes, variantList } = parseProductVariants(item);

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
            colors: colors.length > 0 ? colors : [{ name: 'Mặc định', hex: '#0f172a' }],
            sizes: sizes.length > 0 ? sizes : ['Tiêu chuẩn'],
            variants: variantList,
            isFeatured: true,
            isBestSeller: true,
            isNew: true,
            isFlashSale: false
          };
        });
      }

      const combos = Array.isArray(comboRes) ? comboRes : (Array.isArray(comboRes?.content) ? comboRes.content : (Array.isArray(comboRes?.data) ? comboRes.data : []));
      if (combos && combos.length > 0) {
        comboList = combos
          .filter((c: any) => c.status === 'ACTIVE' || c.isActive !== false)
          .map((c: any) => {
            const price = Number(c.comboPrice || c.price || 0);
            return {
              id: `combo-${c.id}`,
              name: `[Combo] ${c.comboName || c.name}`,
              brand: 'Gói Tiết Kiệm',
              category: 'Gói Combo Tiết Kiệm',
              categoryId: 'combo',
              price: price,
              originalPrice: Math.round(price * 1.25),
              discountPercent: 20,
              rating: 5.0,
              reviewCount: 15,
              images: [c.imageUrl || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'],
              inStock: true,
              stockCount: 50,
              description: c.description || (c.details ? `Gói combo tiết kiệm gồm: ${c.details.map((d: any) => d.productName || d.variantName).join(', ')}` : 'Gói combo sản phẩm ưu đãi giá tốt.'),
              specifications: { 'Loại sản phẩm': 'Gói Combo Ưu Đãi', 'Mã Combo': c.comboCode || `CB-${c.id}` },
              colors: [{ name: 'Combo tiêu chuẩn', hex: '#0f172a' }],
              sizes: ['Bộ Combo'],
              isFeatured: true,
              isBestSeller: true,
              isNew: true,
              isFlashSale: true
            };
          });
      }
    } catch (err) {
      console.warn('Error in getProducts concurrent fetch:', err);
    }

    const all = [...rawList, ...comboList];
    return all.map(p => applyStockOverridesToProduct(p));
  },

  async getProductById(id: string): Promise<Product | null> {
    if (id.startsWith('combo-')) {
      const all = await this.getProducts();
      return all.find(p => p.id === id) || null;
    }

    let p: Product | null = null;

    try {
      const [item, catalogVariantsRes] = await Promise.all([
        fetchApi<any>(`/products/${id}`),
        fetchApi<any>(`/catalog/variants?productId=${id}`).catch(() => [])
      ]);

      if (item) {
        const catalogVariants = Array.isArray(catalogVariantsRes)
          ? catalogVariantsRes
          : (Array.isArray(catalogVariantsRes?.data) ? catalogVariantsRes.data : (catalogVariantsRes?.content || []));

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
        const { colors, sizes, variantList } = parseProductVariants(item, catalogVariants);

        p = {
          id: String(item.id),
          name: item.name,
          brand: item.brand || 'Chính hãng',
          category: item.categoryName || item.category || 'Danh mục sản phẩm',
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
          colors: colors.length > 0 ? colors : [{ name: 'Mặc định', hex: '#0f172a' }],
          sizes: sizes.length > 0 ? sizes : ['Tiêu chuẩn'],
          variants: variantList
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
      const [data, allProducts] = await Promise.all([
        fetchApi<any>('/categories'),
        this.getProducts()
      ]);

      const items = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
      const result: Category[] = [];

      if (items && items.length > 0) {
        items.forEach((c: any) => {
          const catId = String(c.id);
          const catName = (c.categoryName || c.name || '').toLowerCase().trim();
          const count = allProducts.filter(p => {
            const pCatId = String(p.categoryId || '');
            const pCatName = (p.category || '').toLowerCase().trim();
            return pCatId === catId || pCatName === catName;
          }).length;

          result.push({
            id: catId,
            name: c.categoryName || c.name,
            iconName: c.icon || 'Category',
            image: c.imageUrl || c.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
            itemCount: count
          });
        });
      }

      // Add Combo category if combos exist
      const comboCount = allProducts.filter(p => p.categoryId === 'combo').length;
      if (comboCount > 0) {
        result.unshift({
          id: 'combo',
          name: 'Gói Combo Tiết Kiệm',
          iconName: 'Boxes',
          image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80',
          itemCount: comboCount
        });
      }

      return result;
    } catch (err) {
      console.error('API /categories failed:', err);
      return [];
    }
  }
};
