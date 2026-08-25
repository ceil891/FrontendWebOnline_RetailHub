import React, { useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { Button } from '../ui/Button';
import { Trash2, ShoppingBag, ArrowRight, Truck, Tag } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { formatCurrency } from '../../utils/formatters';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    freeShippingThreshold,
    applyCoupon,
    couponDiscount,
    total
  } = useCart();

  const { navigateTo, currentPage } = useNavigation();
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; error?: boolean } | null>(null);

  if (['cart', 'checkout', 'orders', 'success', 'profile'].includes(currentPage)) {
    return null;
  }

  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const success = await applyCoupon(couponInput);
    if (success) {
      setCouponMessage({ text: 'Áp dụng mã giảm giá thành công!' });
    } else {
      setCouponMessage({ text: 'Mã giảm giá không hợp lệ hoặc chưa đạt đơn tối thiểu', error: true });
    }
  };

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    navigateTo('checkout');
  };

  const handleViewCart = () => {
    setIsCartDrawerOpen(false);
    navigateTo('cart');
  };

  return (
    <Drawer
      isOpen={isCartDrawerOpen}
      onClose={() => setIsCartDrawerOpen(false)}
      title={`Giỏ hàng của bạn (${cart.reduce((a, b) => a + b.quantity, 0)})`}
    >
      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={48} className="text-slate-300" />}
          title="Giỏ hàng trống"
          description="Bạn chưa thêm sản phẩm nào vào giỏ hàng."
          actionText="Khám phá mua sắm"
          onAction={() => {
            setIsCartDrawerOpen(false);
            navigateTo('listing');
          }}
        />
      ) : (
        <div className="flex flex-col h-full justify-between -m-6 p-6">
          {/* Top Free Shipping Progress */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-900 mb-1.5">
              <Truck size={16} className="text-sky-600 shrink-0" />
              {amountNeededForFreeShipping > 0 ? (
                <span>
                  Mua thêm <strong className="text-sky-700">{formatCurrency(amountNeededForFreeShipping)}</strong> để được <strong>Miễn phí vận chuyển</strong>!
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">🎉 Chúc mừng! Bạn đã đạt điều kiện Miễn phí vận chuyển!</span>
              )}
            </div>
            <div className="w-full bg-sky-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-6">
            {cart.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                className="flex gap-4 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-xl object-cover bg-white shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.selectedColor && `Màu: ${item.selectedColor}`} {item.selectedSize && `| Kích thước: ${item.selectedSize}`}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-extrabold text-slate-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon and Summary */}
          <div className="border-t border-slate-100 pt-4 space-y-3 bg-white">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Mã giảm giá (SAVE20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Áp dụng
              </button>
            </form>
            {couponMessage && (
              <p className={`text-[11px] font-medium ${couponMessage.error ? 'text-rose-500' : 'text-emerald-600'}`}>
                {couponMessage.text}
              </p>
            )}

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{subtotal >= freeShippingThreshold ? 'MIỄN PHÍ' : '30.000 đ'}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                <span>Tổng tiền</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button onClick={handleCheckout} fullWidth variant="primary" className="py-3">
                Thanh toán ngay <ArrowRight size={16} />
              </Button>
              <button
                onClick={handleViewCart}
                className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5"
              >
                Xem chi tiết giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
