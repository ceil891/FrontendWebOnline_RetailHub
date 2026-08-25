import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { productService } from '../services/productService';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Rating } from '../components/ui/Rating';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/common/ProductCard';
import { QuickViewModal } from '../components/common/QuickViewModal';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RotateCw,
  Check,
  Star,
  Share2,
  Lock,
  ThumbsUp,
  Gift,
  Flame,
  Ticket,
  HelpCircle,
  FileText,
  BookOpen,
  Award
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { selectedProductId, navigateTo } = useNavigation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'guide' | 'warranty' | 'reviews' | 'qa'>('desc');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Review form states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [userReviews, setUserReviews] = useState<any[]>([]);

  useEffect(() => {
    if (selectedProductId) {
      productService.getProductById(selectedProductId).then(data => {
        if (data) {
          setProduct(data);
          if (data.images && data.images[0]) setSelectedImage(data.images[0]);
          // Don't auto-select color/size — user must choose explicitly
          setSelectedColor('');
          setSelectedSize('');
        }
      });

      // Load reviews dynamically from backend
      fetchApi<any[]>(`/products/${selectedProductId}/reviews`)
        .then(res => {
          if (Array.isArray(res)) {
            setUserReviews(res.map((r: any) => ({
              id: String(r.id),
              userName: r.customerName || 'Khách hàng',
              rating: r.rating || 5,
              date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
              comment: r.comment || ''
            })));
          }
        })
        .catch(err => {
          console.warn('Failed to fetch product reviews from backend:', err);
          // Fallback to local default reviews
          setUserReviews([
            { id: '1', userName: 'Trần Văn Minh', rating: 5, date: '15/07/2026', comment: 'Sản phẩm giao cực nhanh, đóng gói cẩn thận 2 lớp chống sốc. Dùng thử âm thanh rất ấm và rõ!' },
            { id: '2', userName: 'Lê Thi Hoài', rating: 5, date: '10/07/2026', comment: 'Hàng chính hãng 100%, nguyên seal fullbox. Nhân viên tư vấn nhiệt tình. Rất hài lòng!' }
          ]);
        });
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (product) {
      productService.getProducts().then(res => {
        setRelatedProducts(res.filter(p => p.id !== product.id).slice(0, 4));
      });
    }
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-xs font-semibold text-slate-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  const isSaved = isInWishlist(product.id);
  const stockCountNum = product.stockCount ?? 25;
  const isOutOfStock = !product.inStock || stockCountNum <= 0;
  const isLowStock = !isOutOfStock && stockCountNum <= 10;

  const handleAddToCart = () => {
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      addToast('Vui lòng chọn màu sắc', 'Bạn cần chọn màu sắc trước khi thêm vào giỏ hàng.', 'error' as any);
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      addToast('Vui lòng chọn kích thước', 'Bạn cần chọn kích thước (size) trước khi thêm vào giỏ hàng.', 'error' as any);
      return;
    }
    addToCart(product, quantity, selectedColor, selectedSize);
    addToast('Đã thêm vào giỏ hàng! 🛒', `${product.name} (${quantity}x) đã được thêm thành công.`);
  };

  const handleBuyNow = () => {
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      addToast('Vui lòng chọn màu sắc', 'Bạn cần chọn màu sắc trước khi mua.', 'error' as any);
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      addToast('Vui lòng chọn kích thước', 'Bạn cần chọn kích thước (size) trước khi mua.', 'error' as any);
      return;
    }
    addToCart(product, quantity, selectedColor, selectedSize);
    navigateTo('cart');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    let userName = 'Khách hàng';
    let customerId: number | undefined = undefined;
    try {
      const uInfo = localStorage.getItem('user_info') || localStorage.getItem('user_profile') || localStorage.getItem('user') || localStorage.getItem('auth_user');
      if (uInfo) {
        const parsed = JSON.parse(uInfo);
        userName = parsed.fullName || parsed.name || 'Khách hàng';
        if (parsed.id) customerId = Number(parsed.id);
      }
    } catch { }

    const reviewPayload = {
      productId: Number(product.id),
      customerId: customerId,
      customerName: userName,
      rating: newRating,
      comment: newComment
    };

    try {
      const res = await fetchApi<any>(`/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewPayload)
      });
      const rev = {
        id: String(res.id || Date.now()),
        userName: res.customerName || reviewPayload.customerName,
        rating: res.rating || reviewPayload.rating,
        date: res.createdAt ? new Date(res.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
        comment: res.comment || reviewPayload.comment
      };
      setUserReviews([rev, ...userReviews]);
      setNewComment('');
      addToast('Cảm ơn bạn', 'Đánh giá của bạn đã được ghi nhận.');
    } catch (err) {
      console.warn('Failed to submit review to backend:', err);
      // Fallback local update
      const rev = {
        id: Date.now().toString(),
        userName: userName,
        rating: newRating,
        date: 'Hôm nay',
        comment: newComment
      };
      setUserReviews([rev, ...userReviews]);
      setNewComment('');
      addToast('Cảm ơn bạn', 'Đánh giá của bạn đã được lưu tạm.');
    }
  };

  return (
    <div className="animate-fade-in pb-16">
      <Breadcrumbs items={[{ label: 'Tất cả sản phẩm', page: 'listing' }, { label: product.name }]} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP PRODUCT DETAIL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm mb-12">
          
          {/* IMAGE GALLERY COLUMN */}
          <div className="space-y-4">
            {/* Main Display Image */}
            <div className="relative w-full h-[450px] rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
              <img
                src={selectedImage || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Top Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.discountPercent ? (
                  <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-full shadow-md">
                    -{product.discountPercent}% GIẢM
                  </span>
                ) : null}
                <span className="px-3 py-1 bg-amber-400 text-slate-900 font-extrabold text-xs rounded-full shadow-md">
                  ⚡ GIỜ VÀNG
                </span>
              </div>

              {/* Floating Wishlist & Share Button (Shopee/Tiki Style) */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded-full backdrop-blur-md shadow-md transition-all ${
                    isSaved ? 'bg-rose-500 text-white scale-110' : 'bg-white/90 text-slate-700 hover:text-rose-500'
                  }`}
                  title="Thêm yêu thích"
                >
                  <Heart size={20} className={isSaved ? 'fill-white' : ''} />
                </button>

                <button
                  onClick={() => addToast('Đã chia sẻ', 'Đã sao chép liên kết sản phẩm!')}
                  className="p-3 bg-white/90 text-slate-700 hover:text-sky-600 rounded-full backdrop-blur-md shadow-md transition-colors"
                  title="Chia sẻ sản phẩm"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Thumbnails Slider */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img ? 'border-slate-900 scale-95 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* DETAILS COLUMN */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              {/* Brand & Stock Status */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>Thương hiệu: <strong className="text-slate-900">{product.brand}</strong></span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  isOutOfStock ? 'bg-rose-100 text-rose-800' : isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isOutOfStock ? '🔴 Hết hàng' : isLowStock ? `⚠️ Chỉ còn ${stockCountNum} sản phẩm` : `✔ Còn ${stockCountNum} sản phẩm trong kho`}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-3">
                {product.name}
              </h1>

              {/* SOCIAL PROOF & RATING METRICS */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <Rating value={4.8} size="md" />
                  <span className="font-black text-slate-900 text-sm">4.8</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 font-bold hover:underline cursor-pointer">(235 đánh giá)</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600 font-extrabold flex items-center gap-1">
                  <Flame size={14} /> 1.250 lượt bán thành công
                </span>
              </div>

              {/* PRICE SAVINGS & PROMOTION BADGES */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 mb-6">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">{formatCurrency(product.price)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
                  )}
                  {product.discountPercent ? (
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg">
                      Tiết kiệm {formatCurrency((product.originalPrice || product.price * 1.2) - product.price)}
                    </span>
                  ) : null}
                </div>

                {/* Voucher Quick Badges */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-amber-200">
                    <Ticket size={12} /> Voucher giảm 100K
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-emerald-200">
                    <Truck size={12} /> Freeship 0đ
                  </span>
                  <span className="px-2.5 py-1 bg-sky-100 text-sky-900 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-sky-200">
                    <ShieldCheck size={12} /> Trả góp 0%
                  </span>
                </div>
              </div>

              {/* DEDICATED INCENTIVE / GIFT BOX */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 mb-6 text-xs">
                <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Gift size={16} className="text-amber-600" /> Quà Tặng & Ưu Đãi Đi Kèm
                </h4>
                <ul className="space-y-1 text-slate-700 font-medium">
                  <li className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-600 shrink-0" /> 🎁 Tặng tai nghe đệm tai cao cấp & Cáp sạc 65W
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-600 shrink-0" /> 🎁 Mua kèm phụ kiện chính hãng giảm ngay 30%
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-600 shrink-0" /> 🎁 Đổi mới 1:1 trong 30 ngày nếu có lỗi sản xuất
                  </li>
                </ul>
              </div>

              {/* COLOR SWATCHES */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    Màu sắc: <span className="text-slate-500 font-normal">{selectedColor || ''}</span>
                    {!selectedColor && <span className="ml-1 text-rose-500 font-extrabold text-[11px] animate-pulse">* Bắt buộc chọn</span>}
                  </label>
                  <div className={`flex gap-3 p-2 rounded-2xl transition-all ${!selectedColor ? 'border-2 border-rose-300 bg-rose-50/50' : 'border border-transparent'}`}>
                    {product.colors.map(c => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
                          selectedColor === c.name ? 'border-slate-900 bg-slate-900 text-white shadow-sm scale-105' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SIZE / CAPACITY SPEC VARIANTS */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    Phiên bản / Kích thước: <span className="text-slate-500 font-normal">{selectedSize || ''}</span>
                    {!selectedSize && <span className="ml-1 text-rose-500 font-extrabold text-[11px] animate-pulse">* Bắt buộc chọn</span>}
                  </label>
                  <div className={`flex flex-wrap gap-2 p-2 rounded-2xl transition-all ${!selectedSize ? 'border-2 border-rose-300 bg-rose-50/50' : 'border border-transparent'}`}>
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                          selectedSize === size
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUANTITY STEPPER & STOCK COUNT */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-900 mb-2">Số lượng mua</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-inner">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-slate-700 hover:bg-slate-200 font-black text-sm"
                    >
                      -
                    </button>
                    <span className="px-5 py-2 text-xs font-extrabold text-slate-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-slate-700 hover:bg-slate-200 font-black text-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span>Tồn kho khả dụng: <strong className="text-slate-900 font-bold">{stockCountNum} sản phẩm</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={handleAddToCart} variant="primary" size="lg" className="w-full">
                  <ShoppingBag size={18} /> Thêm vào giỏ hàng
                </Button>
                <Button onClick={handleBuyNow} variant="secondary" size="lg" className="w-full">
                  Mua ngay
                </Button>
              </div>

              {/* TRUST BADGES & POLICIES */}
              <div className="grid grid-cols-2 gap-3 pt-3 text-[11px] text-slate-600 font-semibold border-t border-slate-100">
                <span className="flex items-center gap-1.5"><Truck size={14} className="text-sky-600" /> Giao hàng trong 2H hỏa tốc</span>
                <span className="flex items-center gap-1.5"><RotateCw size={14} className="text-emerald-600" /> Miễn phí đổi trả 30 ngày</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-amber-500" /> Bảo hành 24 tháng chính hãng</span>
                <span className="flex items-center gap-1.5"><Lock size={14} className="text-indigo-600" /> Thanh toán COD khi nhận hàng</span>
              </div>
            </div>

          </div>
        </div>

        {/* EXPANDED DETAIL TABS SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-12">
          
          {/* Tab Headers */}
          <div className="flex overflow-x-auto gap-2 border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => setActiveTab('desc')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'desc' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={16} /> Mô tả sản phẩm
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'specs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Award size={16} /> Thông số kỹ thuật
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'guide' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={16} /> Hướng dẫn sử dụng
            </button>

            <button
              onClick={() => setActiveTab('warranty')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'warranty' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck size={16} /> Chính sách bảo hành
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'reviews' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Star size={16} /> Đánh giá (235)
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'qa' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <HelpCircle size={16} /> Hỏi & Đáp
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div>
            {/* 1. DESCRIPTION TAB */}
            {activeTab === 'desc' && (
              <div className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                <p>{product.description || 'Sản phẩm được thiết kế tỉ mỉ mang lại trải nghiệm đỉnh cao cho người dùng.'}</p>
                <p>
                  Được sản xuất theo quy trình nghiêm ngặt, đảm bảo độ bền vượt trội và tính thẩm mỹ cao. Lựa chọn hoàn hảo cho nhu cầu sử dụng hàng ngày và làm quà tặng sang trọng.
                </p>
              </div>
            )}

            {/* 2. SPECIFICATIONS TAB */}
            {activeTab === 'specs' && (
              <div className="max-w-2xl">
                <table className="w-full text-xs text-left text-slate-700">
                  <tbody>
                    {Object.entries(product.specifications || {}).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-3 px-4 font-bold text-slate-900 w-1/3 border-b border-slate-100">{key}</td>
                        <td className="py-3 px-4 font-medium border-b border-slate-100">{val}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900 border-b border-slate-100">Bảo hành</td>
                      <td className="py-3 px-4 font-medium border-b border-slate-100">24 tháng chính hãng toàn quốc</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. USER GUIDE TAB */}
            {activeTab === 'guide' && (
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <h4 className="font-extrabold text-sm text-slate-900">Hướng dẫn sử dụng & Bảo quản sản phẩm:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Kiểm tra kĩ niêm phong và mở hộp cẩn thận trước khi sử dụng lần đầu.</li>
                  <li>Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và nhiệt độ cao.</li>
                  <li>Vệ sinh sản phẩm định kỳ bằng khăn mềm ẩm, không sử dụng hóa chất tẩy rửa mạnh.</li>
                </ul>
              </div>
            )}

            {/* 4. WARRANTY POLICY TAB */}
            {activeTab === 'warranty' && (
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <h4 className="font-extrabold text-sm text-slate-900">Quy định Bảo hành & Đổi trả tại AuraMart:</h4>
                <p>✓ Đổi mới 1:1 trong vòng 30 ngày đầu tiên nếu phát sinh lỗi từ nhà sản xuất.</p>
                <p>✓ Bảo hành phần cứng chính hãng 24 tháng tại tất cả trung tâm bảo hành trên toàn quốc.</p>
                <p>✓ Hỗ trợ tiếp nhận bảo hành tận nhà miễn phí phí vận chuyển 2 chiều.</p>
              </div>
            )}

            {/* 5. REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Submit review form */}
                <form onSubmit={handleReviewSubmit} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-900">Gửi đánh giá của bạn</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Đánh giá sao:</span>
                    <Rating value={newRating} onChange={setNewRating} size="md" />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Chia sẻ nhận xét thực tế của bạn về sản phẩm này..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 bg-white"
                  />
                  <Button type="submit" variant="primary" size="sm">Gửi nhận xét</Button>
                </form>

                {/* Reviews List */}
                <div className="space-y-4">
                  {userReviews.map(r => (
                    <div key={r.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900">{r.userName}</span>
                        <span className="text-[11px] text-slate-400">{r.date}</span>
                      </div>
                      <Rating value={r.rating} size="sm" />
                      <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. QA TAB */}
            {activeTab === 'qa' && (
              <div className="space-y-4 text-xs text-slate-700">
                <h4 className="font-extrabold text-sm text-slate-900 mb-4">Câu hỏi thường gặp:</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900">Q: Sản phẩm có đi kèm phụ kiện sạc không?</p>
                  <p className="text-slate-600">A: Dạ sản phẩm đóng gói fullbox chính hãng đã bao gồm cáp sạc và phụ kiện đầy đủ đi kèm ạ.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900">Q: Thời gian giao hàng hỏa tốc trong bao lâu?</p>
                  <p className="text-slate-600">A: Đơn hàng giao tại nội thành TP.HCM và Hà Nội sẽ nhận hàng chỉ từ 1 - 2 giờ sau khi chốt đơn.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Sản Phẩm Cùng Danh Mục</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(rel => (
                <ProductCard key={rel.id} product={rel} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          </div>
        )}

      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
