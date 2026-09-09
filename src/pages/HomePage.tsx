import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { productService } from '../services/productService';
import { bannerService } from '../services/bannerService';
import { ProductCard } from '../components/common/ProductCard';
import { QuickViewModal } from '../components/common/QuickViewModal';
import { Product, Category, Banner } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Zap,
  ArrowRight,
  Flame,
  Star,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
  Send,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Ticket,
  Laptop,
  Smartphone,
  Watch,
  Shirt,
  Coffee,
  Utensils,
  Tv,
  Package
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const getCategoryIcon = (categoryName: string = '') => {
  const name = categoryName.toLowerCase();
  if (name.includes('điện thoại') || name.includes('phone') || name.includes('smartphone')) return <Smartphone size={24} className="text-sky-500 group-hover:text-white transition-colors" />;
  if (name.includes('laptop') || name.includes('máy tính') || name.includes('computer')) return <Laptop size={24} className="text-indigo-500 group-hover:text-white transition-colors" />;
  if (name.includes('tai nghe') || name.includes('âm thanh') || name.includes('headphone') || name.includes('audio')) return <Headphones size={24} className="text-rose-500 group-hover:text-white transition-colors" />;
  if (name.includes('đồng hồ') || name.includes('watch') || name.includes('smartwatch')) return <Watch size={24} className="text-amber-500 group-hover:text-white transition-colors" />;
  if (name.includes('thời trang') || name.includes('quần áo') || name.includes('áo') || name.includes('fashion')) return <Shirt size={24} className="text-purple-500 group-hover:text-white transition-colors" />;
  if (name.includes('đồ uống') || name.includes('nước') || name.includes('beverage') || name.includes('cà phê')) return <Coffee size={24} className="text-emerald-500 group-hover:text-white transition-colors" />;
  if (name.includes('thực phẩm') || name.includes('ăn') || name.includes('food')) return <Utensils size={24} className="text-orange-500 group-hover:text-white transition-colors" />;
  if (name.includes('điện tử') || name.includes('tivi') || name.includes('màn hình')) return <Tv size={24} className="text-blue-500 group-hover:text-white transition-colors" />;
  return <Package size={24} className="text-slate-600 group-hover:text-white transition-colors" />;
};

const BRAND_LOGOS = [
  { name: 'Apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&auto=format&fit=crop&q=80' },
  { name: 'Samsung', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80' },
  { name: 'Sony', logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80' },
  { name: 'Nike', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80' },
  { name: 'Nintendo', logo: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=300&auto=format&fit=crop&q=80' }
];

const TECH_BLOGS = [
  {
    id: 1,
    title: 'Top 5 Tai nghe Chống ồn ANC tốt nhất 2026 cho Dân Công nghệ',
    date: '28/07/2026',
    author: 'AuraTech Team',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    desc: 'Khám phá các tiêu chí chọn mua tai nghe không dây âm thanh chất lượng cao và thời lượng pin cực khủng.'
  },
  {
    id: 2,
    title: 'Hướng dẫn chọn Giày Chạy bộ chuẩn chuyên nghiệp giảm chấn thương',
    date: '25/07/2026',
    author: 'AuraFitness',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    desc: 'Lựa chọn kích thước và độ đàn hồi phù hợp giúp tối ưu hóa hiệu suất luyện tập hàng ngày.'
  },
  {
    id: 3,
    title: 'Bí quyết bảo quản Thiết bị Điện tử kéo dài tuổi thọ bền bỉ',
    date: '20/07/2026',
    author: 'AuraCare',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    desc: 'Những thói quen sạc pin và vệ sinh thiết bị giúp máy hoạt động ổn định trơn tru suốt nhiều năm.'
  }
];

export const HomePage: React.FC = () => {
  const { navigateTo, setFilterCategory } = useNavigation();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'featured' | 'best' | 'new'>('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isHoveredBanner, setIsHoveredBanner] = useState(false);

  // Load products, categories & active banners from API
  useEffect(() => {
    productService.getProducts().then(setProducts);
    productService.getCategories().then(setCategories);
    bannerService.getActiveBanners().then(data => {
      if (data && data.length > 0) {
        setBanners(data);
      }
    });
  }, []);

  // Auto-advance banner carousel every 5s
  useEffect(() => {
    if (banners.length <= 1 || isHoveredBanner) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isHoveredBanner]);

  const handlePrevBanner = () => {
    setCurrentBannerIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNextBanner = () => {
    setCurrentBannerIndex(prev => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner?: Banner) => {
    const target = banner || (banners.length > 0 ? banners[currentBannerIndex] : null);
    if (!target || !target.linkUrl) {
      navigateTo('listing');
      return;
    }
    if (target.linkUrl.startsWith('http://') || target.linkUrl.startsWith('https://')) {
      window.open(target.linkUrl, '_blank');
    } else if (target.linkUrl === '/about' || target.linkUrl === 'about') {
      navigateTo('about');
    } else {
      navigateTo('listing');
    }
  };

  // Flash sale timer countdown
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 13, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashProducts = products.filter(p => p.isFlashSale || p.discountPercent) || products.slice(0, 4);
  const featuredProducts = products.filter(p => {
    if (activeTab === 'featured') return p.isFeatured ?? true;
    if (activeTab === 'best') return p.isBestSeller ?? true;
    return p.isNew || p.discountPercent;
  });

  const activeBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

  return (
    <div className="space-y-16 animate-fade-in pb-12">
      
      {/* 1. HERO BANNER SLIDER (ONLY ACTIVE BANNERS) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div
          onMouseEnter={() => setIsHoveredBanner(true)}
          onMouseLeave={() => setIsHoveredBanner(false)}
          className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[480px] flex items-center shadow-2xl group transition-all"
        >
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0 opacity-50 transition-opacity duration-700">
            <img
              key={activeBanner ? activeBanner.id : 'default'}
              src={activeBanner?.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80"}
              alt={activeBanner?.title || "Hero Banner"}
              className="w-full h-full object-cover animate-fade-in"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/85 to-transparent z-0" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl px-8 sm:px-12 py-12 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-500/20 border border-sky-400/30 backdrop-blur-md rounded-full text-sky-300 text-xs font-bold shadow-sm">
              <Sparkles size={14} /> {activeBanner ? 'Ưu Đãi Nổi Bật 2026' : 'Lễ hội Công nghệ AuraMart 2026'}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight transition-all duration-300">
              {activeBanner?.title ? (
                <span>{activeBanner.title}</span>
              ) : (
                <>
                  Trải Nghiệm Đỉnh Cao <br />
                  <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                    Sản Phẩm Chính Hãng 100%
                  </span>
                </>
              )}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              {activeBanner?.description || activeBanner?.subtitle || 'Sở hữu ngay các thiết bị công nghệ, thời trang và hàng tiêu dùng cao cấp với mức ưu đãi giảm tới 50% cùng dịch vụ giao hàng hỏa tốc trong 2 giờ.'}
            </p>

            {/* Clear Call To Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Button onClick={() => handleBannerClick(activeBanner || undefined)} size="lg" variant="primary" className="shadow-lg hover:scale-105 transition-transform">
                Khám phá sản phẩm ngay <ArrowRight size={18} />
              </Button>
              <button
                onClick={() => navigateTo('about')}
                className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3.5 text-base gap-2.5 border border-white/30 text-white bg-transparent hover:bg-white/10 active:scale-[0.98]"
              >
                Giới thiệu cửa hàng
              </button>
            </div>
          </div>

          {/* Navigation Arrows for Banner Carousel */}
          {banners.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevBanner(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                title="Banner trước"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNextBanner(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                title="Banner kế tiếp"
              >
                <ChevronRight size={22} />
              </button>

              {/* Dot Indicators */}
              <div className="absolute bottom-6 right-8 sm:right-12 z-20 flex items-center gap-2 bg-slate-950/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentBannerIndex === idx ? 'w-6 bg-sky-400' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 4 Core Value Props */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <Truck size={24} className="text-sky-600 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Miễn phí vận chuyển</h4>
              <p className="text-[11px] text-slate-400">Cho đơn hàng từ 500.000 đ</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <RotateCcw size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Đổi trả 30 ngày</h4>
              <p className="text-[11px] text-slate-400">Cam kết hoàn tiền 100%</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <ShieldCheck size={24} className="text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">100% Chính hãng</h4>
              <p className="text-[11px] text-slate-400">Bảo hành 24 tháng toàn quốc</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <Headphones size={24} className="text-indigo-600 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Hỗ trợ 24/7</h4>
              <p className="text-[11px] text-slate-400">Hotline: 1900 8888</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLASH SALE WITH COUNTDOWN & 'ĐÃ BÁN X%' PROGRESS BAR */}
      {flashProducts.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-rose-900/30">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600 text-white rounded-2xl animate-pulse">
                  <Flame size={24} />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                    ⚡ FLASH SALE GIỜ VÀNG
                  </h2>
                  <p className="text-xs text-rose-300 font-medium">Sản phẩm giá sốc - Số lượng có hạn</p>
                </div>
              </div>

              {/* LIVE COUNTDOWN TIMER */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Kết thúc sau:</span>
                <div className="flex items-center gap-1.5 font-mono text-sm font-black">
                  <span className="bg-rose-600 text-white px-2.5 py-1 rounded-xl shadow-inner">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-rose-400">:</span>
                  <span className="bg-rose-600 text-white px-2.5 py-1 rounded-xl shadow-inner">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-rose-400">:</span>
                  <span className="bg-rose-600 text-white px-2.5 py-1 rounded-xl shadow-inner">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Flash Sale Product Grid with Progress Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {flashProducts.slice(0, 4).map(product => (
                <div key={product.id} className="bg-white text-slate-900 rounded-2xl p-4 space-y-3 relative shadow-md">
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-50">
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded-full shadow">
                      -{product.discountPercent || 30}%
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{product.name}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black text-rose-600">{formatCurrency(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
                    )}
                  </div>

                  {/* Progress bar 'Đã bán X%' */}
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-bold">
                      <span className="text-rose-600 flex items-center gap-1"><Flame size={12} /> Đã bán 85%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full w-[85%]" />
                    </div>
                  </div>

                  <Button onClick={() => navigateTo('detail', product.id)} variant="primary" size="sm" className="w-full text-xs mt-2">
                    Mua ngay giá sốc
                  </Button>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 3. CATEGORIES GRID WITH COUNTS */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Danh Mục Sản Phẩm Nổi Bật</h2>
            <p className="text-xs text-slate-500 mt-0.5">Khám phá các ngành hàng chính chủ lực tại AuraMart</p>
          </div>
          <Button onClick={() => navigateTo('listing')} variant="outline" size="sm">
            Xem tất cả <ChevronRight size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => {
            const count = products.filter(p => {
              const pCatId = String(p.categoryId || '');
              const pCatName = (p.category || '').trim().toLowerCase();
              const cId = String(cat.id || '');
              const cName = (cat.name || '').trim().toLowerCase();
              if (cId && pCatId && pCatId === cId) return true;
              if (pCatName && cName && (pCatName === cName || pCatName.includes(cName) || cName.includes(pCatName))) return true;
              return false;
            }).length;

            const finalCount = count;

            return (
              <div
                key={cat.id}
                onClick={() => { setFilterCategory(cat.id); navigateTo('listing'); }}
                className="group p-5 bg-white rounded-3xl border border-slate-100 hover:border-slate-300 hover:shadow-xl transition-all duration-300 cursor-pointer text-center space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 group-hover:bg-slate-900 text-slate-700 flex items-center justify-center transition-all shadow-xs">
                  {getCategoryIcon(cat.name)}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-sky-600 transition-colors">{cat.name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{finalCount} sản phẩm</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. TABBED PRODUCTS: FEATURED / BEST SELLER / NEW */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sản Phẩm Được Mua Nhiều Nhất</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tuyển chọn các sản phẩm chất lượng được khách hàng tin dùng</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'featured' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nổi bật
            </button>
            <button
              onClick={() => setActiveTab('best')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'best' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bán chạy nhất
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'new' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hàng mới về
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      </section>

      {/* 5. BRAND PARTNERS GRID */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h3 className="text-xl font-black text-slate-900">Đối Tác Thương Hiệu Nổi Bật</h3>
            <p className="text-xs text-slate-500">Phân phối chính hãng trực tiếp từ các tập đoàn hàng đầu thế giới</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {BRAND_LOGOS.map((brand, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs hover:shadow-md transition-shadow">
                <span className="font-black text-slate-800 text-lg tracking-wider">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TECH BLOG & GUIDES */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tin Tức & Kinh Nghiệm Mua Sắm</h2>
            <p className="text-xs text-slate-500">Cập nhật xu hướng công nghệ và hướng dẫn sử dụng sản phẩm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TECH_BLOGS.map(blog => (
            <div key={blog.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all space-y-3 group">
              <div className="h-48 overflow-hidden">
                <img src={blog.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[11px] text-slate-400 font-semibold">{blog.date} • {blog.author}</span>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2">{blog.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{blog.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
