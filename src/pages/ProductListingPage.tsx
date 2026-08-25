import React, { useState, useMemo, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { productService } from '../services/productService';
import { ProductCard } from '../components/common/ProductCard';
import { QuickViewModal } from '../components/common/QuickViewModal';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Product, Category, FilterState } from '../types';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { LayoutGrid, List, SlidersHorizontal, X, RotateCcw, Search, Star, CheckSquare, Square, ShieldCheck, Truck, Zap, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: 0, max: 100000000 },
  { label: 'Dưới 1.000.000 đ', min: 0, max: 1000000 },
  { label: 'Từ 1 - 5 triệu đ', min: 1000000, max: 5000000 },
  { label: 'Từ 5 - 15 triệu đ', min: 5000000, max: 15000000 },
  { label: 'Trên 15 triệu đ', min: 15000000, max: 100000000 }
];

export const ProductListingPage: React.FC = () => {
  const { filterCategory, setFilterCategory, searchQuery, setSearchQuery } = useNavigation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Quick filters state
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [selectedPricePreset, setSelectedPricePreset] = useState(0);

  useEffect(() => {
    productService.getProducts({ search: searchQuery, categoryId: filterCategory }).then(setProducts);
    productService.getCategories().then(setCategories);
  }, [searchQuery, filterCategory]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    category: filterCategory || 'all',
    brands: [],
    priceRange: [0, 100000000],
    minRating: 0,
    sortBy: 'featured',
    searchQuery: searchQuery || ''
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract all unique brands
  const availableBrands = useMemo(() => {
    const brandsSet = new Set(products.map(p => p.brand));
    return Array.from(brandsSet);
  }, [products]);

  // Filter and sort products logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category match (check category ID or category Name)
      if (filterCategory !== 'all') {
        const catObj = categories.find(c => c.id === filterCategory);
        const catName = (catObj?.name || filterCategory).toLowerCase();
        const prodCatName = (product.category || '').toLowerCase();
        const prodCatId = (product.categoryId || '').toLowerCase();

        const matchId = prodCatId === filterCategory.toLowerCase();
        const matchName = prodCatName.includes(catName) || catName.includes(prodCatName);

        if (!matchId && !matchName) return false;
      }

      // Brand match
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Price preset match
      const preset = PRICE_PRESETS[selectedPricePreset];
      if (preset && (product.price < preset.min || product.price > preset.max)) {
        return false;
      }

      // Only in stock
      if (onlyInStock && (!product.inStock || product.stockCount <= 0)) {
        return false;
      }

      // Only discount
      if (onlyDiscount && (!product.discountPercent || product.discountPercent <= 0)) {
        return false;
      }

      // Min rating
      if (product.rating < filters.minRating) {
        return false;
      }

      // Search query
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && !product.brand.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-low') return a.price - b.price;
      if (filters.sortBy === 'price-high') return b.price - a.price;
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [products, filterCategory, categories, filters, selectedPricePreset, onlyInStock, onlyDiscount, searchQuery]);

  // Pagination slice
  const paginatedProducts = useMemo(() => {
    const start = (currentPageNum - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPageNum, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  const toggleBrandFilter = (brand: string) => {
    setFilters(prev => {
      const exists = prev.brands.includes(brand);
      return {
        ...prev,
        brands: exists ? prev.brands.filter(b => b !== brand) : [...prev.brands, brand]
      };
    });
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      brands: [],
      priceRange: [0, 100000000],
      minRating: 0,
      sortBy: 'featured',
      searchQuery: ''
    });
    setFilterCategory('all');
    setSearchQuery('');
    setSelectedPricePreset(0);
    setOnlyInStock(false);
    setOnlyDiscount(false);
  };

  return (
    <div className="animate-fade-in pb-16">
      <Breadcrumbs items={[{ label: 'Tất cả sản phẩm' }]} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER TOOLBAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {filterCategory === 'all' ? 'Tất cả sản phẩm' : categories.find(c => c.id === filterCategory)?.name || 'Danh mục sản phẩm'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hiển thị <span className="font-bold text-slate-900">{filteredProducts.length}</span> sản phẩm chính hãng phù hợp
            </p>
          </div>

          {/* Controls Bar: Sort, View Toggle, Page Size & Mobile Filter */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2"
            >
              <SlidersHorizontal size={16} /> Bộ lọc
            </button>

            {/* Page Size Selector */}
            <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="text-slate-400 font-normal">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPageNum(1); }}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={12}>12 SP/Trang</option>
                <option value={24}>24 SP/Trang</option>
                <option value={48}>48 SP/Trang</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="text-slate-400 font-normal">Sắp xếp:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="featured">Nổi bật nhất</option>
                <option value="price-low">Giá: Thấp đến Cao</option>
                <option value="price-high">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>

            {/* Grid / List View switch */}
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                title="Xem dạng lưới"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                title="Xem dạng danh sách"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(filterCategory !== 'all' || filters.brands.length > 0 || searchQuery || selectedPricePreset > 0 || onlyInStock || onlyDiscount) && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold text-slate-400">Bộ lọc đang chọn:</span>
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-800 rounded-full text-xs font-medium">
                Danh mục: {categories.find(c => c.id === filterCategory)?.name || filterCategory}
                <button onClick={() => setFilterCategory('all')}><X size={12} /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-medium">
                Tìm kiếm: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}><X size={12} /></button>
              </span>
            )}
            {selectedPricePreset > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                Mức giá: {PRICE_PRESETS[selectedPricePreset].label}
                <button onClick={() => setSelectedPricePreset(0)}><X size={12} /></button>
              </span>
            )}
            {onlyInStock && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                Chỉ còn hàng sẵn
                <button onClick={() => setOnlyInStock(false)}><X size={12} /></button>
              </span>
            )}
            {onlyDiscount && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-medium">
                Chỉ sản phẩm giảm giá
                <button onClick={() => setOnlyDiscount(false)}><X size={12} /></button>
              </span>
            )}
            {filters.brands.map(b => (
              <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-800 rounded-full text-xs font-medium">
                {b}
                <button onClick={() => toggleBrandFilter(b)}><X size={12} /></button>
              </span>
            ))}
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 ml-2"
            >
              <RotateCcw size={12} /> Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR FILTERS (Desktop) */}
          <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            
            {/* Quick Checkbox Filters */}
            <div className="border-b border-slate-100 pb-4 space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">Lọc nhanh</h3>
              <label onClick={() => setOnlyInStock(!onlyInStock)} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                {onlyInStock ? <CheckSquare size={16} className="text-slate-900" /> : <Square size={16} className="text-slate-300" />}
                <span>Chỉ hiện SP còn hàng</span>
              </label>
              <label onClick={() => setOnlyDiscount(!onlyDiscount)} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                {onlyDiscount ? <CheckSquare size={16} className="text-slate-900" /> : <Square size={16} className="text-slate-300" />}
                <span>Chỉ hiện SP đang giảm giá</span>
              </label>
            </div>

            {/* Price Presets Filter */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Khoảng giá</h3>
              <div className="space-y-1 text-xs">
                {PRICE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPricePreset(idx)}
                    className={`w-full text-left py-1.5 px-3 rounded-xl transition-colors font-medium ${
                      selectedPricePreset === idx ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Danh mục</h3>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`w-full text-left py-1.5 px-3 rounded-xl transition-colors font-medium flex justify-between ${
                    filterCategory === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Tất cả danh mục</span>
                  <span>{products.length}</span>
                </button>
                {categories.map(cat => {
                  const matchingCount = products.filter(p => {
                    const pCatName = (p.category || '').toLowerCase();
                    const pCatId = (p.categoryId || '').toLowerCase();
                    const cName = (cat.name || '').toLowerCase();
                    const cId = (cat.id || '').toLowerCase();
                    return pCatId === cId || pCatName.includes(cName) || cName.includes(pCatName);
                  }).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className={`w-full text-left py-1.5 px-3 rounded-xl transition-colors font-medium flex justify-between ${
                        filterCategory === cat.id ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={filterCategory === cat.id ? 'text-slate-200' : 'text-slate-400'}>({matchingCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Thương hiệu</h3>
              <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                {availableBrands.map(brand => {
                  const isChecked = filters.brands.includes(brand);
                  return (
                    <label
                      key={brand}
                      onClick={() => toggleBrandFilter(brand)}
                      className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 select-none py-1"
                    >
                      {isChecked ? <CheckSquare size={16} className="text-slate-900" /> : <Square size={16} className="text-slate-300" />}
                      <span className="font-medium">{brand}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Đánh giá tối thiểu</h3>
              <div className="space-y-1 text-xs">
                {[5, 4, 3].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilters({ ...filters, minRating: filters.minRating === rating ? 0 : rating })}
                    className={`w-full text-left py-1.5 px-3 rounded-xl transition-colors font-medium flex items-center gap-2 ${
                      filters.minRating === rating ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star size={14} className={filters.minRating === rating ? 'fill-amber-400 text-amber-400' : 'text-amber-400 fill-amber-400'} />
                    <span>{rating} sao trở lên</span>
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* MAIN PRODUCT GRID */}
          <main className="lg:col-span-3">
            {paginatedProducts.length === 0 ? (
              <EmptyState
                icon={<Search size={56} className="text-slate-300" />}
                title="Không tìm thấy sản phẩm phù hợp"
                description="Không có sản phẩm nào khớp với tiêu chí tìm kiếm hoặc bộ lọc của bạn. Hãy thử xóa bộ lọc hoặc chọn danh mục khác."
                actionText="Xóa tất cả bộ lọc"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="space-y-8">
                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
                  {paginatedProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={setQuickViewProduct}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-6 border-t border-slate-100">
                    <Pagination
                      currentPage={currentPageNum}
                      totalPages={totalPages}
                      onPageChange={setCurrentPageNum}
                    />
                  </div>
                )}
              </div>
            )}
          </main>

        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
