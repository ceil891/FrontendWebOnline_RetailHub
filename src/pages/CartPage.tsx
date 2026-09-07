import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Trash2, ArrowRight, Truck, ShoppingBag, Tag, ShieldCheck, MapPin, Edit3, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    subtotal,
    freeShippingThreshold,
    applyCoupon,
    couponCode,
    couponDiscount,
    total
  } = useCart();

  const { navigateTo } = useNavigation();
  const [promoInput, setPromoInput] = useState('');
  const [promoAlert, setPromoAlert] = useState<{ text: string; success?: boolean } | null>(null);

  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const finalCartTotal = subtotal - couponDiscount;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    const ok = await applyCoupon(promoInput);
    if (ok) {
      setPromoAlert({ text: `Đã áp dụng mã ưu đãi ${promoInput.toUpperCase()}!`, success: true });
    } else {
      setPromoAlert({ text: 'Mã ưu đãi không hợp lệ hoặc chưa đạt đơn tối thiểu.', success: false });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="animate-fade-in pb-16">
        <Breadcrumbs items={[{ label: 'Giỏ hàng mua sắm' }]} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon={<ShoppingBag size={56} className="text-slate-300" />}
            title="Giỏ hàng của bạn đang trống"
            description="Hãy khám phá các danh mục sản phẩm công nghệ và mua sắm ngay hôm nay."
            actionText="Bắt đầu mua sắm ngay"
            onAction={() => navigateTo('listing')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-16">
      <Breadcrumbs items={[{ label: 'Giỏ hàng mua sắm' }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Giỏ hàng của bạn ({cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: ITEM LIST & DELIVERY ADDRESS SELECTOR */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Free shipping progress bar */}
            <div className="bg-sky-50 border border-sky-100 rounded-3xl p-5">
              <div className="flex items-center gap-3 text-xs font-semibold text-sky-900 mb-2">
                <Truck size={20} className="text-sky-600 shrink-0" />
                {amountNeeded > 0 ? (
                  <span>
                    Mua thêm <strong className="text-sky-700">{formatCurrency(amountNeeded)}</strong> để được <strong>Miễn phí vận chuyển</strong>!
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">🎉 Bạn đủ điều kiện nhận Miễn phí giao hàng hỏa tốc!</span>
                )}
              </div>
              <div className="w-full bg-sky-200/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.images[0]}
                      alt=""
                      className="w-24 h-24 rounded-2xl object-cover bg-slate-50 shrink-0"
                    />
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">{item.product.brand}</span>
                      <h3
                        onClick={() => navigateTo('detail', item.product.id)}
                        className="text-sm font-bold text-slate-900 hover:text-sky-600 cursor-pointer transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.selectedColor && `Màu: ${item.selectedColor}`} {item.selectedSize && `| Size: ${item.selectedSize}`}
                      </p>
                      <span className="text-sm font-extrabold text-slate-900 mt-2 block sm:hidden">
                        {formatCurrency(item.product.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-2 sm:pt-0">
                    <span className="text-sm font-extrabold text-slate-900 hidden sm:block">
                      {formatCurrency(item.product.price)}
                    </span>

                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200/50 font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200/50 font-bold text-sm"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total */}
                    <span className="text-base font-extrabold text-slate-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* SHIPPING & RETURN POLICY INFO */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900">Giao hàng toàn quốc & Phí ship tính tự động theo khu vực</p>
                  <p className="text-slate-500 leading-relaxed">
                    Cước phí vận chuyển chính xác sẽ được tính tự động dựa trên địa chỉ giao hàng bạn chọn tại bước <strong>Thanh toán</strong>. Đơn hàng từ <strong>500.000đ</strong> sẽ được <strong>Miễn phí vận chuyển toàn quốc</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => navigateTo('listing')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                ← Tiếp tục mua sắm
              </button>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Tóm tắt đơn hàng
              </h3>

              {/* Coupon input */}
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Mã giảm giá / Ưu đãi</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Mã (SAVE20)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm">
                    Áp dụng
                  </Button>
                </div>
                {promoAlert && (
                  <p className={`text-xs font-medium ${promoAlert.success ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {promoAlert.text}
                  </p>
                )}
              </form>

              {/* Summary Calculations */}
              <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Giảm giá ({couponCode})</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-slate-900">
                    {isFreeShipping ? 'MIỄN PHÍ' : 'Tính khi thanh toán'}
                  </span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                  <span>Tổng tiền</span>
                  <span>{formatCurrency(finalCartTotal)}</span>
                </div>
              </div>

              <Button onClick={() => navigateTo('checkout')} fullWidth variant="primary" size="lg">
                Thực hiện thanh toán <ArrowRight size={18} />
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
                <ShieldCheck size={14} className="text-emerald-500" /> Đảm bảo thanh toán an toàn & bảo mật
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
