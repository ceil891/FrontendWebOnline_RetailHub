import React, { useState } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Truck, RefreshCw, CreditCard, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, Gift } from 'lucide-react';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const { navigateTo, setFilterCategory } = useNavigation();
  const { addToast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      addToast('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email (ví dụ: tenban@gmail.com).', 'error');
      return;
    }

    // Save newsletter voucher to local storage stash
    try {
      const stored = localStorage.getItem('user_collected_vouchers');
      const vouchers = stored ? JSON.parse(stored) : [];
      const newVoucher = {
        id: 'VC-WELCOME-200K',
        voucherCode: 'WELCOME200K',
        voucherName: 'Ưu đãi thành viên mới nhận tin',
        discountValue: 200000,
        discountType: 'FIXED_AMOUNT',
        minOrderValue: 500000,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ACTIVE',
        collectedAt: new Date().toISOString()
      };
      if (!vouchers.some((v: any) => v.voucherCode === 'WELCOME200K')) {
        vouchers.push(newVoucher);
        localStorage.setItem('user_collected_vouchers', JSON.stringify(vouchers));
      }
    } catch {}

    setIsSubscribed(true);
    addToast('Đăng ký nhận tin thành công! 🎉', 'Mã voucher WELCOME200K (Giảm 200.000 đ) đã được cấp vào ví voucher của bạn!');
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 mt-20 border-t border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 text-sky-400 rounded-2xl shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Giao hàng miễn phí</h4>
              <p className="text-xs text-slate-400">Cho đơn hàng từ 5.000.000 đ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 text-emerald-400 rounded-2xl shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bảo hành chính hãng</h4>
              <p className="text-xs text-slate-400">Cam kết bảo hành lên tới 24 tháng</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 text-amber-400 rounded-2xl shrink-0">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Đổi trả trong 30 ngày</h4>
              <p className="text-xs text-slate-400">Đổi trả nhanh chóng không thủ tục</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 text-indigo-400 rounded-2xl shrink-0">
              <CreditCard size={24} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Thanh toán an toàn</h4>
              <p className="text-xs text-slate-400">Bảo mật thông tin 100%</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-extrabold text-xl">
                A
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Aura<span className="text-sky-400">Mart</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Hệ thống bán lẻ thiết bị công nghệ, điện tử, laptop và phụ kiện chính hãng hàng đầu dành cho khách hàng.
            </p>

            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-500" />
                <span>123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-500" />
                <span>1800 6868 (Miễn phí cuộc gọi)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-500" />
                <span>cskh@auramart.vn</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Danh mục nổi bật</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => { setFilterCategory('electronics'); navigateTo('listing'); }} className="hover:text-white transition-colors">
                  Thiết bị điện tử & Âm thanh
                </button>
              </li>
              <li>
                <button onClick={() => { setFilterCategory('laptops'); navigateTo('listing'); }} className="hover:text-white transition-colors">
                  Máy tính & Laptop
                </button>
              </li>
              <li>
                <button onClick={() => { setFilterCategory('fashion'); navigateTo('listing'); }} className="hover:text-white transition-colors">
                  Thời trang & Phụ kiện
                </button>
              </li>
              <li>
                <button onClick={() => { setFilterCategory('watches'); navigateTo('listing'); }} className="hover:text-white transition-colors">
                  Đồng hồ thông minh
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition-colors">
                  Giới thiệu cửa hàng
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('orders')} className="hover:text-white transition-colors">
                  Tra cứu đơn hàng
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('profile')} className="hover:text-white transition-colors">
                  Tài khoản cá nhân
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('cart')} className="hover:text-white transition-colors">
                  Giỏ hàng của tôi
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">Chính sách vận chuyển</a>
              </li>
              <li>
                <a href="#returns" className="hover:text-white transition-colors">Chính sách bảo hành & Đổi trả</a>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Đăng ký nhận tin</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Nhận voucher 200.000 đ cho đơn hàng đầu tiên và thông tin ưu đãi mới nhất.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                placeholder="Nhập địa chỉ email của bạn..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
              <Button type="submit" fullWidth variant="secondary" className="py-2 text-xs font-bold">
                Đăng ký nhận voucher 200.000 đ
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AuraMart Store. Tất cả quyền được bảo lưu.</p>

          <div className="flex items-center gap-4 text-slate-400">
            <a href="#" className="hover:text-white transition-colors p-2 bg-slate-800 rounded-xl">
              <Facebook size={16} />
            </a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-slate-800 rounded-xl">
              <Instagram size={16} />
            </a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-slate-800 rounded-xl">
              <Twitter size={16} />
            </a>
            <a href="#" className="hover:text-white transition-colors p-2 bg-slate-800 rounded-xl">
              <Youtube size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
