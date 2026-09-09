import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Modal } from '../ui/Modal';
import { Rating } from '../ui/Rating';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ShoppingBag, Heart, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  useEffect(() => {
    if (product) {
      const colors = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : [{ name: 'Mặc định', hex: '#0f172a' }];
      const sizes = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['Tiêu chuẩn'];
      const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [DEFAULT_FALLBACK_IMAGE];

      setSelectedColor(colors[0]?.name || 'Mặc định');
      setSelectedSize(sizes[0] || 'Tiêu chuẩn');
      setQuantity(1);
      setSelectedImage(images[0] || DEFAULT_FALLBACK_IMAGE);
    }
  }, [product]);

  if (!product) return null;

  const isSaved = isInWishlist(product.id);
  const colorsList = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : [{ name: 'Mặc định', hex: '#0f172a' }];
  const imagesList = Array.isArray(product.images) && product.images.length > 0 ? product.images : [DEFAULT_FALLBACK_IMAGE];
  const activeImage = selectedImage || imagesList[0] || DEFAULT_FALLBACK_IMAGE;

  const handleAdd = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
    addToast('Đã thêm vào giỏ', `Sản phẩm ${product.name} (${quantity}x) đã được thêm vào giỏ hàng.`);
    onClose();
  };

  const handleFullDetails = () => {
    onClose();
    navigateTo('detail', product.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Gallery */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative h-60 sm:h-72 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
            <img
              src={activeImage}
              alt={product.name}
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE; }}
              className="w-full h-full object-cover object-center"
            />
            {product.discountPercent ? (
              <Badge variant="danger" className="absolute top-3 left-3">
                -{product.discountPercent}%
              </Badge>
            ) : null}
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {imagesList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  activeImage === img ? 'border-slate-900 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE; }}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">
              <span>{product.brand || 'Chính hãng'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug">
              {product.name}
            </h2>
            <div className="mb-3">
              <Rating value={product.rating || 5} reviewCount={product.reviewCount || 0} size="md" />
            </div>

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900">{formatCurrency(product.price || 0)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">{formatCurrency(product.originalPrice)}</span>
              )}
            </div>

            <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
              {product.description || 'Sản phẩm chính hãng chất lượng cao.'}
            </p>

            {/* Colors */}
            {colorsList.length > 0 && (
              <div className="mb-4">
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Màu sắc: <span className="text-slate-500 font-normal">{selectedColor}</span>
                </span>
                <div className="flex gap-2">
                  {colorsList.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        selectedColor === c.name ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' : 'hover:scale-105 opacity-80'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === c.name && <Check size={12} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="mb-4">
              <span className="block text-xs font-semibold text-slate-700 mb-2">Số lượng</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/50 font-semibold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/50 font-semibold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex gap-3">
              <Button onClick={handleAdd} fullWidth variant="primary" className="py-2.5 sm:py-3">
                <ShoppingBag size={18} /> Thêm vào giỏ hàng
              </Button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Heart size={20} className={isSaved ? 'fill-rose-500' : ''} />
              </button>
            </div>
            <button
              onClick={handleFullDetails}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 cursor-pointer"
            >
              Xem thông số chi tiết sản phẩm <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

