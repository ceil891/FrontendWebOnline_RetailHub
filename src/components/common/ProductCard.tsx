import React from 'react';
import { Product } from '../../types';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Rating } from '../ui/Rating';
import { Badge } from '../ui/Badge';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  viewMode = 'grid'
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  const isSaved = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    addToast('Đã thêm vào giỏ', `Sản phẩm ${product.name} đã được thêm vào giỏ hàng của bạn.`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
    addToast(
      isSaved ? 'Đã xóa khỏi yêu thích' : 'Đã lưu yêu thích',
      isSaved ? `Đã xóa ${product.name} khỏi danh sách yêu thích.` : `Đã thêm ${product.name} vào danh sách yêu thích.`
    );
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => navigateTo('detail', product.id)}
        className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-hover hover:border-slate-200 transition-all duration-300 flex flex-col sm:flex-row gap-6 cursor-pointer"
      >
        <div className="relative w-full sm:w-56 h-48 rounded-xl overflow-hidden bg-slate-50 shrink-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          {product.discountPercent ? (
            <Badge variant="danger" className="absolute top-3 left-3">
              -{product.discountPercent}%
            </Badge>
          ) : null}
        </div>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>{product.brand}</span>
              <Rating value={product.rating} reviewCount={product.reviewCount} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-sky-600 transition-colors line-clamp-1 mb-2">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">{formatCurrency(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleWishlistToggle}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isSaved
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Heart size={18} className={isSaved ? 'fill-rose-500' : ''} />
              </button>
              <button
                onClick={handleAddToCart}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <ShoppingBag size={16} /> Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigateTo('detail', product.id)}
      className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-hover hover:border-slate-200 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* Top Badges & Actions */}
      <div>
        <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-50 mb-3">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {product.discountPercent ? (
              <Badge variant="danger" className="font-black text-[11px] shadow-sm">-{product.discountPercent}% GIẢM</Badge>
            ) : null}
            {product.isFlashSale && (
              <Badge variant="warning" className="font-extrabold text-[10px]">⚡ GIỜ VÀNG</Badge>
            )}
            {product.isNew && (
              <Badge variant="info" className="font-extrabold text-[10px]">MỚI</Badge>
            )}
            {product.isBestSeller && (
              <Badge variant="success" className="font-extrabold text-[10px]">BÁN CHẠY</Badge>
            )}
          </div>

          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm transition-all duration-200 z-10 ${
              isSaved
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-rose-500'
            }`}
          >
            <Heart size={16} className={isSaved ? 'fill-white' : ''} />
          </button>

          {/* Hover Quick View & Add Buttons Overlay */}
          <div className="absolute inset-x-0 bottom-3 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <button
              onClick={handleQuickView}
              className="flex-1 py-2 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-900 hover:text-white shadow-md flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye size={14} /> Xem nhanh
            </button>
            <button
              onClick={handleAddToCart}
              className="p-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-sky-600 shadow-md transition-colors shrink-0"
              title="Thêm giỏ"
            >
              <ShoppingBag size={14} />
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium mb-1 flex items-center justify-between">
          <span>{product.brand}</span>
          <span className={`text-[10px] font-semibold ${!product.inStock || product.stockCount <= 0 ? 'text-rose-500 font-bold' : product.stockCount <= 10 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>
            {!product.inStock || product.stockCount <= 0
              ? 'Hết hàng'
              : product.stockCount <= 10
              ? `Sắp hết (${product.stockCount})`
              : 'Còn hàng'}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors line-clamp-1 mb-1.5">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <Rating value={product.rating} reviewCount={product.reviewCount} />
          {/* E-Commerce E-Badges */}
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-extrabold border border-emerald-100">
              Freeship 0đ
            </span>
            <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[9px] font-extrabold border border-sky-100">
              Trả góp 0%
            </span>
          </div>
        </div>
      </div>

      {/* Footer Price & Add */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <span className="text-base font-black text-slate-900">{formatCurrency(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[11px] text-slate-400 line-through block sm:inline sm:ml-1.5">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-sky-600 transition-all duration-200 shadow-sm active:scale-95 shrink-0"
          title="Thêm vào giỏ"
        >
          <ShoppingBag size={16} />
        </button>
      </div>
    </div>
  );
};
