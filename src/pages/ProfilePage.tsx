import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProductCard } from '../components/common/ProductCard';
import { QuickViewModal } from '../components/common/QuickViewModal';
import { EmptyState } from '../components/ui/EmptyState';
import {
  User,
  MapPin,
  KeyRound,
  Heart,
  Camera,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Award,
  Calendar,
  Sparkles,
  ShoppingBag,
  Truck,
  Ticket,
  CreditCard,
  Star,
  ChevronRight,
  TrendingUp,
  Gift,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { VietQRCard } from '../components/common/VietQRCard';
import { authService } from '../services/authService';
import { customerService } from '../services/customerService';
import { orderService } from '../services/orderService';
import { addressService, CustomerAddress } from '../services/addressService';
import { paymentMethodService, OnlinePaymentMethod } from '../services/paymentMethodService';
import { reviewService, ProductReviewItem } from '../services/reviewService';
import { Order } from '../types';
import { formatCurrency } from '../utils/formatters';
import { calculateLoyaltyInfo, LOYALTY_TIERS, getLoyaltyTiersFromApi, MemberTierInfo } from '../services/loyaltyService';

const PROVINCES = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Bình Dương',
  'Đồng Nai',
  'Cần Thơ',
  'Hải Phòng',
  'Tỉnh/Thành phố khác'
];

export const ProfilePage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const { wishlist } = useWishlist();
  const { addToast } = useToast();
  const { navigateTo, currentPage } = useNavigation();
  const { addToCart } = useCart();

  const currentUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'orders' | 'tracking' | 'vouchers' | 'loyalty' | 'addresses' | 'payments' | 'security' | 'reviews' | 'wishlist'
  >(() => {
    if (initialTab) return initialTab as any;
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) return tabFromUrl as any;
    const savedTab = sessionStorage.getItem('profile_active_tab');
    if (savedTab) return savedTab as any;
    return 'profile';
  });

  const handleTabChange = (tab: any) => {
    if (!currentUser && tab !== 'wishlist') {
      addToast('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để truy cập mục này.', 'info');
      navigateTo('auth');
      return;
    }
    setActiveTab(tab);
    sessionStorage.setItem('profile_active_tab', tab);
    if (currentPage === 'wishlist') {
      navigateTo('profile');
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const handleTabEvent = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
        sessionStorage.setItem('profile_active_tab', e.detail);
      }
    };
    window.addEventListener('switch_profile_tab', handleTabEvent);
    return () => window.removeEventListener('switch_profile_tab', handleTabEvent);
  }, []);

  // Redirect to auth if not logged in (except when viewing wishlist)
  useEffect(() => {
    if (!currentUser && activeTab !== 'wishlist' && currentPage !== 'wishlist') {
      navigateTo('auth');
      addToast('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để truy cập trang cá nhân.', 'warning');
    }
  }, [currentUser, activeTab, currentPage, navigateTo, addToast]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string>('');
  const [loyaltyTiers, setLoyaltyTiers] = useState<MemberTierInfo[]>(LOYALTY_TIERS);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [inputVoucherCode, setInputVoucherCode] = useState('');
  const [isCollectingVoucher, setIsCollectingVoucher] = useState(false);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<OnlinePaymentMethod[]>([]);
  const [myReviews, setMyReviews] = useState<ProductReviewItem[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [showTrackingVietQR, setShowTrackingVietQR] = useState(false);

  // Form states - Initialized with localStorage info if available
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [profileInfo, setProfileInfo] = useState(() => {
    const uInfo = authService.getCurrentUser();
    return {
      fullName: uInfo?.name || uInfo?.fullName || 'Khách hàng',
      email: uInfo?.email || '',
      phone: uInfo?.phone || uInfo?.phoneNumber || '',
      dob: uInfo?.dob || '2000-01-01',
      avatarUrl: uInfo?.avatarUrl || uInfo?.avatar || '',
      points: Number(uInfo?.points || 0),
      membershipRank: uInfo?.membershipRank || 'Đồng',
      totalSpend: Number(uInfo?.totalSpend || 0)
    };
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Lỗi định dạng', 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setProfileInfo(prev => ({ ...prev, avatarUrl: base64Url }));

        const targetId = customerId || (currentUser?.id ? Number(currentUser.id) : 1);
        await customerService.updateProfile(targetId, {
          fullName: profileInfo.fullName,
          phone: profileInfo.phone,
          email: profileInfo.email,
          dob: profileInfo.dob,
          avatarUrl: base64Url,
          avatar: file
        });

        const updatedUser = {
          ...currentUser,
          name: profileInfo.fullName,
          fullName: profileInfo.fullName,
          phone: profileInfo.phone,
          email: profileInfo.email,
          dob: profileInfo.dob,
          avatar: base64Url,
          avatarUrl: base64Url
        };
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('auth_changed'));

        addToast('Đã đổi ảnh đại diện 🎉', 'Ảnh đại diện của bạn đã được cập nhật thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Load customer profile, orders & loyalty tiers from Backend API
  useEffect(() => {
    if (currentUser?.email || currentUser?.phone || currentUser?.id) {
      customerService.getProfile(currentUser?.id ? Number(currentUser.id) : undefined, currentUser.email, currentUser.phone).then(p => {
        if (p) {
          if (p.id) setCustomerId(p.id);
          setProfileInfo(prev => ({
            ...prev,
            fullName: p.fullName || prev.fullName,
            phone: p.phone || prev.phone,
            email: p.email || prev.email,
            dob: p.dob || prev.dob,
            avatarUrl: p.avatarUrl || prev.avatarUrl,
            points: p.points !== undefined ? p.points : prev.points,
            membershipRank: p.membershipRank || prev.membershipRank,
            totalSpend: p.totalSpend !== undefined ? p.totalSpend : prev.totalSpend
          }));
        }
      });
    }

    orderService.getOrders().then(res => {
      if (res && res.length > 0) {
        setOrders(res);
        setSelectedTrackingOrderId(prev => prev || res[0].id);
      }
    });

    getLoyaltyTiersFromApi().then(tiers => {
      if (tiers && tiers.length > 0) {
        setLoyaltyTiers(tiers);
      }
    });

    // Load addresses, payments & customer reviews from API
    addressService.getAddresses(currentUser?.id ? Number(currentUser.id) : undefined, currentUser?.phone).then(setAddresses);
    paymentMethodService.getOnlinePaymentMethods().then(setPaymentMethods);
    reviewService.getCustomerReviews(currentUser?.id ? Number(currentUser.id) : undefined, currentUser?.name).then(setMyReviews);

    const reloadReviews = () => {
      reviewService.getCustomerReviews(currentUser?.id ? Number(currentUser.id) : undefined, currentUser?.name).then(setMyReviews);
    };
    window.addEventListener('reviews_updated', reloadReviews);
    return () => window.removeEventListener('reviews_updated', reloadReviews);
  }, [currentUser?.email, currentUser?.phone, currentUser?.name, currentUser?.id]);

  if (!currentUser) return null;

  // Compute Loyalty metrics dynamically from real orders or backend profile
  const totalOrdersAmount = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const totalSpent = profileInfo.totalSpend > 0 ? profileInfo.totalSpend : totalOrdersAmount;
  const completedOrdersCount = orders.filter(o => (o.status as string) === 'delivered' || (o.status as string) === 'completed' || (o.status as string) === 'pending' || (o.status as string) === 'shipped' || (o.status as string) === 'processing').length;
  const loyaltyInfo = calculateLoyaltyInfo(totalSpent, loyaltyTiers);
  const { points, progressPercent, remainingToNext } = loyaltyInfo;

  // Resolve current tier using the backend membershipRank field
  const currentTier = loyaltyTiers.find(t => t.tierName.toLowerCase() === profileInfo.membershipRank.toLowerCase()) ||
                      loyaltyTiers.find(t => t.tierCode === 'BRONZE') ||
                      loyaltyTiers[0];

  const [newAddr, setNewAddr] = useState({
    name: currentUser?.name || currentUser?.fullName || profileInfo.fullName || 'Khách hàng',
    phone: currentUser?.phone || currentUser?.phoneNumber || profileInfo.phone || '',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    street: '',
    addressType: 'HOME' as 'HOME' | 'OFFICE' | 'OTHER'
  });
  const [isAddingAddr, setIsAddingAddr] = useState(false);

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    localStorage.setItem('user_addresses', JSON.stringify(addresses));
  }, [addresses]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = customerId || (currentUser?.id ? Number(currentUser.id) : 1);
    
    await customerService.updateProfile(targetId, {
      fullName: profileInfo.fullName,
      phone: profileInfo.phone,
      email: profileInfo.email,
      dob: profileInfo.dob
    });

    // Synchronize to localStorage immediately so F5 never reverts
    const updatedUser = {
      ...currentUser,
      name: profileInfo.fullName,
      fullName: profileInfo.fullName,
      phone: profileInfo.phone,
      email: profileInfo.email,
      dob: profileInfo.dob
    };
    localStorage.setItem('user_info', JSON.stringify(updatedUser));
    localStorage.setItem('user_profile', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('auth_changed'));

    addToast('Cập nhật thành công', 'Thông tin cá nhân của bạn đã được cập nhật.');
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.street) return;
    const fullAddressStr = `${newAddr.street}, ${newAddr.ward ? newAddr.ward + ', ' : ''}${newAddr.district}, ${newAddr.province}`;
    
    const created = await addressService.createAddress({
      customerId: currentUser?.id ? Number(currentUser.id) : undefined,
      customerPhone: profileInfo.phone || currentUser?.phone,
      recipientName: newAddr.name,
      phoneNumber: newAddr.phone || profileInfo.phone,
      province: newAddr.province,
      district: newAddr.district,
      ward: newAddr.ward,
      street: newAddr.street,
      fullAddress: fullAddressStr,
      addressType: newAddr.addressType,
      isDefault: addresses.length === 0
    });

    if (created) {
      const updated = [...addresses, created];
      setAddresses(updated);
      localStorage.setItem('user_selected_address', JSON.stringify(created));
      setNewAddr({ name: profileInfo.fullName, phone: profileInfo.phone, province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Thành', street: '', addressType: 'HOME' });
      setIsAddingAddr(false);
      addToast('Đã thêm địa chỉ', 'Địa chỉ giao hàng mới đã được lưu vào hệ thống.');
    }
  };

  const handleDeleteAddress = async (id: string | number) => {
    await addressService.deleteAddress(id);
    setAddresses(addresses.filter(a => String(a.id) !== String(id)));
    addToast('Đã xóa địa chỉ', 'Địa chỉ đã được xóa khỏi sổ địa chỉ.');
  };

  const handleSetDefaultAddress = async (id: string | number) => {
    const updated = await addressService.setDefaultAddress(id, currentUser?.id ? Number(currentUser.id) : undefined, profileInfo.phone);
    if (updated) {
      setAddresses(addresses.map(a => ({
        ...a,
        isDefault: String(a.id) === String(id)
      })));
      localStorage.setItem('user_selected_address', JSON.stringify(updated));
      addToast('Đã đặt mặc định', 'Đã cập nhật địa chỉ giao hàng mặc định.');
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword) {
      addToast('Lỗi', 'Vui lòng nhập mật khẩu hiện tại.', 'error');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      addToast('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.', 'error');
      return;
    }
    if (passwordState.newPassword.length < 6) {
      addToast('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
      return;
    }

    try {
      await authService.changePassword(
        passwordState.currentPassword,
        passwordState.newPassword,
        passwordState.confirmPassword
      );
      addToast('Đổi mật khẩu thành công', 'Mật khẩu của bạn đã được cập nhật thành công.');
      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      addToast('Đổi mật khẩu thất bại', err?.message || 'Mật khẩu hiện tại không chính xác.', 'error');
    }
  };

  useEffect(() => {
    setIsLoadingVouchers(true);
    const fetchVouchers = async () => {
      try {
        const [custVouchers, publicPrograms, localCollected] = await Promise.all([
          fetchApi<any[]>('/crm/customer-vouchers').catch(() => []),
          fetchApi<any[]>('/crm/vouchers').catch(() => []),
          JSON.parse(localStorage.getItem('user_collected_vouchers') || '[]')
        ]);

        const myPhone = profileInfo.phone ? profileInfo.phone.replace(/\s+/g, '') : '';
        const myName = (profileInfo.fullName || '').trim().toLowerCase();

        // 1. Personal vouchers granted by Admin or campaigns
        const personalList = (Array.isArray(custVouchers) ? custVouchers : ((custVouchers as any)?.data || []))
          .filter((cv: any) => cv.status !== 'DELETED')
          .filter((cv: any) => {
            const cvPhone = (cv.customerPhone || cv.phone || '').replace(/\s+/g, '');
            const cvName = (cv.customerName || '').trim().toLowerCase();
            const matchPhone = myPhone && cvPhone && myPhone === cvPhone;
            const matchId = cv.customerId && currentUser?.id && String(cv.customerId) === String(currentUser.id);
            const matchName = myName && cvName && (myName === cvName || cvName.includes(myName));
            return matchPhone || matchId || matchName;
          })
          .map((cv: any) => ({
            code: cv.voucherCode || `VC-${cv.id}`,
            discount: cv.discountType === 'PERCENTAGE' ? `Giảm ${Number(cv.discountValue || cv.value)}%` : `Giảm ${formatCurrency(cv.discountValue || cv.value || 50000)}`,
            desc: cv.voucherName || cv.programName || `Voucher cấp đặc quyền riêng cho bạn`,
            expiry: cv.expiryDate || cv.endDate ? new Date(cv.expiryDate || cv.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn',
            minSpend: cv.minOrderValue || 0,
            isPersonal: true,
            status: cv.status || 'ACTIVE'
          }));

        // 2. Program vouchers (public campaigns)
        const progList = (Array.isArray(publicPrograms) ? publicPrograms : ((publicPrograms as any)?.content || (publicPrograms as any)?.data || []))
          .filter((p: any) => p.isActive !== false && p.status !== 'INACTIVE')
          .map((p: any) => ({
            code: p.voucherCode || p.code || `PROMO-${p.id}`,
            discount: p.discountType === 'PERCENTAGE' ? `Giảm ${Number(p.value || p.discountValue)}%` : `Giảm ${formatCurrency(p.value || p.discountValue || 50000)}`,
            desc: p.name || p.voucherName || `Chương trình khuyến mãi toàn hệ thống`,
            expiry: p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '30 ngày kể từ hôm nay',
            minSpend: p.minOrderValue || 0,
            isPersonal: false,
            status: 'ACTIVE'
          }));

        // 3. Local newsletter or collected vouchers
        const localList = Array.isArray(localCollected) ? localCollected.map((v: any) => ({
          code: v.voucherCode,
          discount: v.discountType === 'PERCENTAGE' ? `Giảm ${Number(v.discountValue)}%` : `Giảm ${formatCurrency(v.discountValue)}`,
          desc: v.voucherName,
          expiry: v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('vi-VN') : '30 ngày',
          minSpend: v.minOrderValue || 0,
          isPersonal: true,
          status: 'ACTIVE'
        })) : [];

        // Deduplicate by voucher code
        const codeMap = new Map();
        [...personalList, ...localList, ...progList].forEach(item => {
          if (item.code && !codeMap.has(item.code)) {
            codeMap.set(item.code, item);
          }
        });

        const merged = Array.from(codeMap.values());
        setVouchers(merged);

        // Check if new personal voucher granted and notify
        if (personalList.length > 0) {
          const lastCount = Number(sessionStorage.getItem('last_personal_voucher_count') || 0);
          if (personalList.length > lastCount) {
            sessionStorage.setItem('last_personal_voucher_count', String(personalList.length));
            addToast('Voucher mới dành cho bạn! 🎉', `Bạn có voucher đặc quyền mới: ${personalList[0].code} - ${personalList[0].desc}`);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch vouchers:', err);
      } finally {
        setIsLoadingVouchers(false);
      }
    };

    fetchVouchers();
  }, [profileInfo.phone, profileInfo.email, profileInfo.fullName, currentUser?.id]);

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputVoucherCode.trim().toUpperCase();
    if (!code) {
      addToast('Chưa nhập mã', 'Vui lòng nhập mã voucher bạn muốn lưu vào ví.', 'warning');
      return;
    }

    setIsCollectingVoucher(true);
    try {
      // 1. Check if user already has it
      if (vouchers.some((v: any) => v.code?.toUpperCase() === code)) {
        addToast('Voucher đã có', `Mã voucher ${code} đã có trong kho voucher của bạn.`, 'info');
        setInputVoucherCode('');
        return;
      }

      // 2. Fetch public programs to validate
      const publicPrograms = await fetchApi<any[]>('/crm/vouchers').catch(() => []);
      const matched = (Array.isArray(publicPrograms) ? publicPrograms : []).find(
        (p: any) => (p.voucherCode?.toUpperCase() === code || p.code?.toUpperCase() === code) && p.isActive !== false
      );

      const newVoucher = matched
        ? {
            id: `VC-${matched.id || Date.now()}`,
            voucherCode: matched.voucherCode || matched.code || code,
            voucherName: matched.name || matched.voucherName || 'Ưu đãi khuyến mãi',
            discountValue: matched.value || matched.discountValue || 10,
            discountType: matched.discountType || 'PERCENTAGE',
            minOrderValue: matched.minOrderValue || 0,
            expiryDate: matched.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'ACTIVE',
            collectedAt: new Date().toISOString()
          }
        : {
            id: `VC-${Date.now()}`,
            voucherCode: code,
            voucherName: 'Mã ưu đãi đặc biệt',
            discountValue: 10,
            discountType: 'PERCENTAGE',
            minOrderValue: 0,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'ACTIVE',
            collectedAt: new Date().toISOString()
          };

      // Save to local storage collected vouchers
      const stored = localStorage.getItem('user_collected_vouchers');
      const list = stored ? JSON.parse(stored) : [];
      list.push(newVoucher);
      localStorage.setItem('user_collected_vouchers', JSON.stringify(list));

      // Append to UI list
      setVouchers((prev) => [
        {
          code: newVoucher.voucherCode,
          discount: newVoucher.discountType === 'PERCENTAGE' ? `Giảm ${newVoucher.discountValue}%` : `Giảm ${formatCurrency(newVoucher.discountValue)}`,
          desc: newVoucher.voucherName,
          expiry: new Date(newVoucher.expiryDate).toLocaleDateString('vi-VN'),
          minSpend: newVoucher.minOrderValue,
          isPersonal: true,
          status: 'ACTIVE'
        },
        ...prev
      ]);

      setInputVoucherCode('');
      addToast('Lưu voucher thành công! 🎉', `Mã ${code} đã được lưu vào kho voucher của bạn.`);
    } catch (err: any) {
      addToast('Lỗi lưu voucher', err?.message || 'Không thể lưu mã voucher này.', 'error');
    } finally {
      setIsCollectingVoucher(false);
    }
  };

  return (
    <div className="animate-fade-in pb-16">
      <Breadcrumbs items={[{ label: 'Tài khoản cá nhân' }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* PREMIUM LOYALTY PROFILE HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 mb-8 shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            
            {/* User Info Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-sky-400 to-indigo-500 p-1 shadow-xl overflow-hidden">
                    {profileInfo.avatarUrl ? (
                      <img
                        src={profileInfo.avatarUrl}
                        alt={profileInfo.fullName}
                        className="w-full h-full rounded-full object-cover bg-slate-900"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-3xl">
                        {profileInfo.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-transform hover:scale-110 shadow-lg border-2 border-slate-900 cursor-pointer"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera size={14} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{profileInfo.fullName}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border flex items-center gap-1.5 shadow-sm ${currentTier.badgeBgClass}`}>
                      <span>{currentTier.badgeIcon}</span> {currentTier.tierName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{profileInfo.email}</p>
                  
                  {/* Dynamic Status Message */}
                  <p className="text-[11px] text-amber-300 font-semibold pt-1">
                    {totalSpent === 0 ? (
                      '🎁 Bạn chưa có đơn hàng nào. Mua đơn đầu tiên để bắt đầu tích điểm!'
                    ) : (
                      `🎉 Đã tích lũy ${points.toLocaleString('vi-VN')} điểm thưởng từ tổng chi tiêu ${formatCurrency(totalSpent)}!`
                    )}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                <button
                  onClick={() => setActiveTab('loyalty')}
                  className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] border border-white/20 text-white hover:bg-white/10 text-xs px-3 py-1.5 gap-1.5"
                >
                  <Gift size={16} /> Xem quyền lợi xếp hạng
                </button>
              </div>
            </div>

            {/* PROGRESS TO NEXT TIER BAR */}
            {currentTier.nextTierName && (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-2">
                <div className="flex flex-wrap justify-between items-center text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-amber-400" /> Tiến độ lên {currentTier.nextTierName}
                  </span>
                  <span className="text-amber-300 font-extrabold">
                    {remainingToNext > 0
                      ? `Còn ${formatCurrency(remainingToNext)} để nâng hạng`
                      : `Đã đủ điều kiện lên ${currentTier.nextTierName}!`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* 6 LOYALTY STATS CARDS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center pt-2">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Tổng đơn hàng</span>
                <span className="text-lg font-black text-white">{completedOrdersCount} đơn</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Điểm thưởng</span>
                <span className="text-lg font-black text-amber-400">{points.toLocaleString('vi-VN')} điểm</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Tổng chi tiêu</span>
                <span className="text-xs font-black text-emerald-400 block pt-1">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Hạng hiện tại</span>
                <span className={`text-xs font-extrabold block pt-1 ${currentTier.badgeTextClass}`}>{currentTier.tierName}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Địa chỉ đã lưu</span>
                <span className="text-lg font-black text-white">{addresses.length}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Sản phẩm yêu thích</span>
                <span className="text-lg font-black text-rose-400">{wishlist.length}</span>
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* EXPANDED 10-ITEM SIDEBAR NAVIGATION */}
          <aside className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm h-fit space-y-1">
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeTab === 'profile' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <User size={16} /> Thông tin cá nhân
            </button>

            <button
              onClick={() => handleTabChange('orders')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'orders' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={16} /> Đơn hàng của tôi
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('tracking')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeTab === 'tracking' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Truck size={16} /> Theo dõi vận chuyển
            </button>

            <button
              onClick={() => handleTabChange('vouchers')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'vouchers' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ticket size={16} /> Voucher của tôi
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {vouchers.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('loyalty')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'loyalty' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star size={16} className="text-amber-500" /> Điểm thưởng & Hạng
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-800 font-bold">
                {currentTier.badgeIcon}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('addresses')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeTab === 'addresses' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MapPin size={16} /> Sổ địa chỉ nhận hàng
            </button>

            <button
              onClick={() => handleTabChange('payments')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeTab === 'payments' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CreditCard size={16} /> Phương thức thanh toán
            </button>

            <button
              onClick={() => handleTabChange('security')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeTab === 'security' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <KeyRound size={16} /> Đổi mật khẩu
            </button>

            <button
              onClick={() => handleTabChange('reviews')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeTab === 'reviews' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={16} /> Đánh giá của tôi
            </button>

            <button
              onClick={() => handleTabChange('wishlist')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'wishlist' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart size={16} /> Sản phẩm yêu thích
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'wishlist' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {wishlist.length}
              </span>
            </button>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-3">
            
            {/* 1. PERSONAL INFO TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                
                {/* Summary Loyalty Card */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Tổng quan Loyalty thành viên</span>
                    <h4 className="text-xl font-extrabold">{currentTier.tierName} {currentTier.badgeIcon}</h4>
                    <p className="text-xs text-slate-400">
                      Điểm tích lũy: <strong className="text-amber-400">{points.toLocaleString('vi-VN')} điểm</strong> | Tổng chi tiêu: <strong className="text-emerald-400">{formatCurrency(totalSpent)}</strong>
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab('loyalty')} variant="primary" size="sm" className="shrink-0">
                    Chi tiết quy tắc xếp hạng <ArrowRight size={14} />
                  </Button>
                </div>

                <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-extrabold text-slate-900">Thông tin cá nhân</h3>
                    <p className="text-xs text-slate-500">Quản lý hồ sơ cá nhân và cập nhật thông tin liên hệ.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Họ và tên"
                      value={profileInfo.fullName}
                      onChange={(e) => setProfileInfo({ ...profileInfo, fullName: e.target.value })}
                    />
                    <Input
                      label="Địa chỉ Email"
                      type="email"
                      value={profileInfo.email}
                      onChange={(e) => setProfileInfo({ ...profileInfo, email: e.target.value })}
                    />
                    <Input
                      label="Số điện thoại"
                      value={profileInfo.phone}
                      onChange={(e) => setProfileInfo({ ...profileInfo, phone: e.target.value })}
                    />
                    <Input
                      label="Ngày sinh"
                      type="date"
                      value={profileInfo.dob}
                      onChange={(e) => setProfileInfo({ ...profileInfo, dob: e.target.value })}
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <Button type="submit" variant="primary" size="lg">Lưu thay đổi</Button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. MY ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Đơn hàng của tôi</h3>
                    <p className="text-xs text-slate-500">Danh sách các đơn hàng Online bạn đã khởi tạo.</p>
                  </div>
                  <Button onClick={() => navigateTo('orders')} variant="outline" size="sm">
                    Xem lịch sử đầy đủ <ArrowRight size={14} />
                  </Button>
                </div>

                {orders.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingBag size={48} className="text-slate-300" />}
                    title="Bạn chưa có đơn hàng nào"
                    description="Hãy khám phá cửa hàng và thực hiện mua sắm đơn hàng đầu tiên."
                    actionText="Khám phá cửa hàng ngay"
                    onAction={() => navigateTo('listing')}
                  />
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        onClick={() => navigateTo('orders', undefined, order.id)}
                        className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 hover:text-emerald-600 transition-colors">{order.id}</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                              ONLINE
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Ngày đặt: {order.date} • {order.items?.length || 1} sản phẩm</p>
                          <p className="text-xs font-bold text-slate-900">Tổng tiền: {formatCurrency(order.total)}</p>
                        </div>
                        <Button onClick={(e) => { e.stopPropagation(); navigateTo('orders', undefined, order.id); }} variant="outline" size="sm">
                          Chi tiết đơn hàng
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. ORDER TRACKING TAB */}
            {activeTab === 'tracking' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Theo dõi vận chuyển</h3>
                  <p className="text-xs text-slate-500">Cập nhật hành trình vận chuyển chi tiết cho toàn bộ đơn hàng Online của bạn.</p>
                </div>

                {orders.length === 0 ? (
                  <EmptyState
                    icon={<Truck size={48} className="text-slate-300" />}
                    title="Chưa có vận đơn cần theo dõi"
                    description="Hiện tại bạn không có đơn hàng nào trong lịch sử mua sắm."
                  />
                ) : (() => {
                  const currentTrackingOrder = orders.find(o => o.id === selectedTrackingOrderId) || orders[0];
                  const isCancelled = currentTrackingOrder.status === 'cancelled';
                  const isDelivered = currentTrackingOrder.status === 'delivered';
                  const isShipped = currentTrackingOrder.status === 'shipped';
                  const isProcessing = currentTrackingOrder.status === 'processing';

                  return (
                    <div className="space-y-6">
                      {/* Order selector tabs / cards */}
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-2">Chọn đơn hàng cần xem hành trình:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {orders.map(o => {
                            const isSelected = (currentTrackingOrder.id === o.id);
                            return (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setSelectedTrackingOrderId(o.id)}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-900'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-mono font-bold">{o.id}</span>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : o.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                        o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                        o.status === 'shipped' ? 'bg-sky-100 text-sky-800' :
                                        o.status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-amber-100 text-amber-800'
                                  }`}>
                                    {o.status === 'cancelled' ? 'Đã hủy' :
                                     o.status === 'delivered' ? 'Đã giao' :
                                     o.status === 'shipped' ? 'Đang giao' :
                                     o.status === 'processing' ? 'Đang đóng gói' :
                                     'Chờ xác nhận'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>{o.date}</span>
                                  <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>{formatCurrency(o.total)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Order Tracking Detail Card */}
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 font-mono">Đơn hàng: {currentTrackingOrder.id}</span>
                              {currentTrackingOrder.trackingNumber && (
                                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                  Mã vận đơn: {currentTrackingOrder.trackingNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Kho xuất hàng: <strong>{currentTrackingOrder.branchName || 'Chi nhánh AuraMart TP.HCM'}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setShowTrackingVietQR(!showTrackingVietQR)}
                              className="px-3 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <QrCode size={13} className="text-sky-600" />
                              {showTrackingVietQR ? 'Ẩn mã QR' : 'Mã VietQR'}
                            </button>
                            <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold w-fit ${
                              isCancelled ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              isDelivered ? 'bg-emerald-100 text-emerald-800' :
                              isShipped ? 'bg-sky-100 text-sky-800' :
                              isProcessing ? 'bg-indigo-100 text-indigo-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {isCancelled ? '❌ Đã hủy đơn hàng' :
                               isDelivered ? '✓ Giao hàng thành công' :
                               isShipped ? '🚚 Đang vận chuyển tới địa chỉ' :
                               isProcessing ? '📦 Đang đóng gói tại chi nhánh' :
                               '⏳ Chờ xác nhận & phân bổ kho'}
                            </span>
                          </div>
                        </div>

                        {/* Optional VietQR Code Display in Tracking */}
                        {showTrackingVietQR && (
                          <div className="animate-fade-in">
                            <VietQRCard
                              orderCode={currentTrackingOrder.id}
                              amount={currentTrackingOrder.total || 0}
                              memo={currentTrackingOrder.id}
                              compact={true}
                            />
                          </div>
                        )}

                        {/* Order Items Preview */}
                        {currentTrackingOrder.items && currentTrackingOrder.items.length > 0 && (
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold text-slate-600 block">Sản phẩm trong kiện hàng ({currentTrackingOrder.items.length}):</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentTrackingOrder.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-xs">
                                  <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                                  <div className="flex-1 truncate">
                                    <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                                    <p className="text-[11px] text-slate-400">{item.quantity}x @ {formatCurrency(item.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tracking Progression Timeline */}
                        <div className="space-y-5 relative pl-6 border-l-2 border-slate-300">
                          {isCancelled ? (
                            <>
                              <div className="relative">
                                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-rose-500 border-2 border-white ring-4 ring-rose-100" />
                                <span className="text-xs font-bold text-rose-700 block">Đơn hàng đã được hủy</span>
                                <span className="text-[11px] text-slate-500">Đơn hàng đã được hủy theo yêu cầu. Số lượng tồn kho đã được hoàn trả về chi nhánh.</span>
                              </div>
                              <div className="relative opacity-60">
                                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white" />
                                <span className="text-xs font-bold text-slate-900 block">Đã tiếp nhận đơn hàng Online</span>
                                <span className="text-[11px] text-slate-500">Hệ thống đã ghi nhận đơn mua của bạn ({currentTrackingOrder.date}).</span>
                              </div>
                            </>
                          ) : (
                            <>
                              {isDelivered && (
                                <div className="relative">
                                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                                  <span className="text-xs font-bold text-slate-900 block">Đã giao hàng thành công</span>
                                  <span className="text-[11px] text-slate-500">Khách hàng đã nhận kiện hàng thành công và ký nhận.</span>
                                </div>
                              )}

                              <div className="relative">
                                <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${isShipped || isDelivered ? 'bg-sky-500' : 'bg-slate-300'} border-2 border-white`} />
                                <span className="text-xs font-bold text-slate-900 block">
                                  {isShipped || isDelivered ? 'Đang giao tới địa chỉ nhận hàng' : 'Chờ xuất kho giao hàng'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {currentTrackingOrder.shipperName ? `Tài xế ${currentTrackingOrder.shipperName} (${currentTrackingOrder.carrier || 'Viettel Post'}) đang phụ trách giao hàng.` : 'Đơn vị vận chuyển sẽ tiếp nhận sau khi đóng gói.'}
                                </span>
                              </div>

                              <div className="relative">
                                <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${isProcessing || isShipped || isDelivered ? 'bg-indigo-500' : 'bg-slate-300'} border-2 border-white`} />
                                <span className="text-xs font-bold text-slate-900 block">
                                  Đóng gói tại {currentTrackingOrder.branchName || 'Chi nhánh AuraMart'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {currentTrackingOrder.status === 'pending' ? 'Đang chờ phân bổ chi nhánh xuất kho.' : 'Chi nhánh đang thực hiện kiểm tra sản phẩm và đóng gói tem niêm phong.'}
                                </span>
                              </div>

                              <div className="relative">
                                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                                <span className="text-xs font-bold text-slate-900 block">Đã tiếp nhận đơn hàng Online</span>
                                <span className="text-[11px] text-slate-500">Hệ thống đã ghi nhận đơn mua của bạn ({currentTrackingOrder.date}).</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4. MY VOUCHERS TAB */}
            {activeTab === 'vouchers' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Voucher & Ưu đãi của tôi</h3>
                  <p className="text-xs text-slate-500">Danh sách mã giảm giá và quà tặng thành viên dành cho bạn.</p>
                </div>

                {/* Input box to collect voucher code */}
                <form onSubmit={handleRedeemVoucher} className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Nhập mã voucher hoặc mã quà tặng (VD: WELCOME200K, SALE10)..."
                      value={inputVoucherCode}
                      onChange={(e) => setInputVoucherCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isCollectingVoucher || !inputVoucherCode.trim()}
                    className="w-full sm:w-auto py-2.5 px-5 shrink-0"
                  >
                    {isCollectingVoucher ? 'Đang lưu...' : 'Lưu vào ví'}
                  </Button>
                </form>

                {isLoadingVouchers ? (
                  <div className="py-8 text-center text-slate-500 font-medium text-sm">
                    Đang tải danh sách voucher...
                  </div>
                ) : vouchers.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 font-medium text-sm">
                    Bạn chưa có voucher nào khả dụng.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vouchers.map((v, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border ${v.isPersonal ? 'border-amber-300 bg-amber-50/40' : 'border-indigo-100 bg-indigo-50/20'} space-y-3 relative overflow-hidden`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${v.isPersonal ? 'text-amber-900 bg-amber-200' : 'text-indigo-900 bg-indigo-100'}`}>
                              {v.code} {v.isPersonal && '⭐ Đặc quyền'}
                            </span>
                            <h4 className="text-base font-extrabold text-slate-900 mt-1">{v.discount}</h4>
                          </div>
                          <Ticket size={24} className={v.isPersonal ? 'text-amber-500' : 'text-indigo-500'} />
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{v.desc}</p>
                        <div className={`flex justify-between items-center pt-2 border-t ${v.isPersonal ? 'border-amber-100' : 'border-indigo-50'} text-[11px] text-slate-500`}>
                          <span>HSD: {v.expiry}</span>
                          <Button onClick={() => { navigateTo('listing'); addToast('Đã sao chép mã', `Mã ${v.code} đã sẵn sàng áp dụng!`); }} variant="primary" size="sm">
                            Dùng ngay
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. LOYALTY RULES & TIERS TAB */}
            {activeTab === 'loyalty' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Quy tắc Xếp hạng Thành viên Loyalty</h3>
                  <p className="text-xs text-slate-500">Tích lũy chi tiêu để nâng hạng và mở khóa các đặc quyền VIP độc quyền.</p>
                </div>

                {/* Current Tier Highlight Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-amber-300 font-bold">Hạng hiện tại của bạn</span>
                    <span className="text-xs text-slate-400">10.000 đ = 1 Điểm thưởng</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{currentTier.badgeIcon}</span>
                    <div>
                      <h4 className="text-2xl font-black text-white">{currentTier.tierName}</h4>
                      <p className="text-xs text-slate-300">Tổng tích lũy chi tiêu: {formatCurrency(totalSpent)} ({points.toLocaleString('vi-VN')} điểm)</p>
                    </div>
                  </div>
                </div>

                {/* All Loyalty Tiers Grid Table */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Bảng quy chuẩn các cấp bậc Loyalty</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {loyaltyTiers.filter(t => t.tierCode === currentTier.tierCode).map(t => (
                      <div
                        key={t.tierCode}
                        className={`p-5 rounded-2xl border transition-all ${
                          currentTier.tierCode === t.tierCode
                            ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{t.badgeIcon}</span>
                            <div>
                              <h5 className="text-base font-extrabold text-slate-900">{t.tierName}</h5>
                              <span className="text-xs text-slate-500 font-semibold">
                                Điều kiện: {t.minSpend === 0 ? 'Vừa đăng ký tài khoản' : `Tổng chi tiêu ≥ ${formatCurrency(t.minSpend)}`}
                              </span>
                            </div>
                          </div>

                          {currentTier.tierCode === t.tierCode && (
                            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-bold w-fit">
                              Hạng hiện tại
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 border-t border-slate-100 pt-3">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Quyền lợi đặc quyền:</span>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {t.benefits.map((b, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 6. ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Sổ địa chỉ nhận hàng</h3>
                    <p className="text-xs text-slate-500">Quản lý các địa chỉ giao hàng được đồng bộ từ Backend Database.</p>
                  </div>
                  <Button onClick={() => setIsAddingAddr(!isAddingAddr)} variant="outline" size="sm">
                    <Plus size={14} /> Thêm địa chỉ mới
                  </Button>
                </div>

                {isAddingAddr && (
                  <form onSubmit={handleAddAddress} className="bg-slate-50 p-5 rounded-2xl space-y-4 mb-4 border border-slate-200 animate-fade-in">
                    <h4 className="text-xs font-bold text-slate-900">Thêm địa chỉ giao hàng mới</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Họ tên người nhận"
                        placeholder="Nguyễn Văn A"
                        value={newAddr.name}
                        onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Số điện thoại"
                        placeholder="0988123456"
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tỉnh / Thành phố</label>
                        <select
                          value={newAddr.province}
                          onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 bg-white"
                        >
                          {PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Quận / Huyện"
                        placeholder="Ví dụ: Quận 1, Cầu Giấy..."
                        value={newAddr.district}
                        onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                        required
                      />

                      <Input
                        label="Phường / Xã"
                        placeholder="Ví dụ: Phường Bến Thành..."
                        value={newAddr.ward}
                        onChange={(e) => setNewAddr({ ...newAddr, ward: e.target.value })}
                      />
                    </div>

                    <Input
                      label="Địa chỉ nhà / Tên đường chi tiết"
                      placeholder="Ví dụ: 123 Nguyễn Trãi, Số nhà..."
                      value={newAddr.street}
                      onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                      required
                    />

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewAddr({ ...newAddr, addressType: 'HOME' })}
                          className={`px-3 py-1 rounded-full text-xs border ${newAddr.addressType === 'HOME' ? 'bg-slate-900 text-white font-bold' : 'border-slate-200 text-slate-600'}`}
                        >
                          Nhà riêng
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewAddr({ ...newAddr, addressType: 'OFFICE' })}
                          className={`px-3 py-1 rounded-full text-xs border ${newAddr.addressType === 'OFFICE' ? 'bg-slate-900 text-white font-bold' : 'border-slate-200 text-slate-600'}`}
                        >
                          Văn phòng
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingAddr(false)}>Hủy</Button>
                        <Button type="submit" variant="primary" size="sm">Lưu vào Backend</Button>
                      </div>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <EmptyState
                    icon={<MapPin size={48} className="text-slate-300" />}
                    title="Chưa có địa chỉ nào được lưu"
                    description="Hãy thêm địa chỉ giao hàng để tiện cho việc thanh toán đơn hàng."
                    actionText="Thêm địa chỉ ngay"
                    onAction={() => setIsAddingAddr(true)}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 relative group hover:border-slate-400 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <MapPin size={14} className={addr.addressType === 'OFFICE' ? 'text-indigo-600' : 'text-sky-600'} />
                            {addr.recipientName}
                            <span className="text-[10px] font-normal text-slate-500">
                              ({addr.addressType === 'OFFICE' ? 'Văn phòng' : 'Nhà riêng'})
                            </span>
                          </span>
                          {addr.isDefault ? (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                              Mặc định
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold underline"
                            >
                              Đặt mặc định
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-medium line-clamp-2">{addr.fullAddress}</p>
                        <p className="text-xs text-slate-400 font-mono">{addr.phoneNumber}</p>

                        {!addr.isDefault && (
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="absolute bottom-3 right-3 text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Xóa địa chỉ"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <div className="space-y-6 animate-fade-in">
                {/* Personal Saved Cards / E-Wallets */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">Thẻ thanh toán & Ví điện tử của tôi</h3>
                      <p className="text-xs text-slate-500">Quản lý các thẻ quốc tế và ví điện tử đã liên kết để thanh toán 1-chạm nhanh chóng.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-800 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white space-y-4 shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl" />
                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-xs font-extrabold tracking-wider text-amber-300">VISA PLATINUM</span>
                        <CreditCard size={22} className="text-amber-400" />
                      </div>
                      <p className="font-mono text-base font-bold tracking-widest relative z-10">•••• •••• •••• 4242</p>
                      <div className="flex justify-between items-center text-xs text-slate-300 relative z-10">
                        <span>CHỦ THẺ: {profileInfo.fullName.toUpperCase()}</span>
                        <span>HSD: 12/28</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-pink-200 bg-pink-50/50 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-pink-900">Ví Điện Tử MoMo</span>
                          <span className="w-7 h-7 rounded-full bg-pink-600 text-white text-xs font-bold flex items-center justify-center">M</span>
                        </div>
                        <p className="font-mono text-sm font-bold text-slate-900 mt-2">{profileInfo.phone || '0988 123 456'}</p>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Đã liên kết & Sẵn sàng thanh toán
                      </span>
                    </div>
                  </div>
                </div>

                {/* Store Supported Payment Methods */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">Phương thức thanh toán Cửa hàng hỗ trợ</h3>
                      <p className="text-xs text-slate-500">Các kênh thanh toán online khả dụng được cấu hình trực tiếp từ hệ thống StoreManager.</p>
                    </div>
                    <span className="px-3 py-1 bg-sky-100 text-sky-800 font-bold text-xs rounded-full">
                      {paymentMethods.length} Kênh kích hoạt
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map(pm => (
                      <div
                        key={pm.methodCode}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {pm.methodCode === 'MOMO' || pm.logoUrl ? (
                              <img
                                src={pm.logoUrl || 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png'}
                                alt={pm.methodName}
                                className="w-8 h-8 object-contain rounded-lg bg-white p-0.5 border border-slate-100"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23A50064"/><text x="50" y="65" font-family="Arial,sans-serif" font-weight="900" font-size="36" fill="%23FFFFFF" text-anchor="middle">MoMo</text></svg>';
                                }}
                              />
                            ) : (
                              <CreditCard size={24} className="text-amber-500" />
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{pm.methodName}</h4>
                              <span className="text-[10px] text-slate-400 font-mono">Mã: {pm.methodCode}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            {pm.status === 'ACTIVE' ? 'Sẵn sàng' : pm.status}
                          </span>
                        </div>

                        {pm.methodCode === 'BANK_TRANSFER' && (
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
                            <p><strong>Ngân hàng:</strong> {pm.bankName || 'MBBank Quân Đội'}</p>
                            <p><strong>STK:</strong> <span className="font-mono text-slate-900 font-bold">{pm.bankAccount || '0388123456789'}</span></p>
                            <p><strong>Chủ TK:</strong> {pm.bankAccountName || 'CONG TY SMART RETAIL'}</p>
                          </div>
                        )}

                        {pm.methodCode === 'MOMO' && (
                          <p className="text-xs text-pink-700 bg-pink-50 p-2.5 rounded-xl border border-pink-100">
                            Hỗ trợ quét mã QR MoMo và thanh toán qua App MoMo trên điện thoại.
                          </p>
                        )}

                        {pm.methodCode === 'VNPAY' && (
                          <p className="text-xs text-sky-700 bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                            Cổng VNPAY-QR thanh toán nhanh qua 30+ ứng dụng Ngân hàng.
                          </p>
                        )}

                        {pm.methodCode === 'COD' && (
                          <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                            Thanh toán tiền mặt tận nơi khi shipper giao kiện hàng tới tay bạn.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. SECURITY TAB */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 max-w-xl">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Đổi mật khẩu bảo mật</h3>
                  <p className="text-xs text-slate-500">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn.</p>
                </div>
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                  required
                />
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                  required
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                  required
                />
                <div className="pt-4 border-t border-slate-100">
                  <Button type="submit" variant="primary" size="lg">Cập nhật mật khẩu</Button>
                </div>
              </form>
            )}

            {/* 9. MY REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Đánh giá sản phẩm của tôi</h3>
                    <p className="text-xs text-slate-500">Lịch sử nhận xét và số sao bạn đã đánh giá cho các sản phẩm đã mua.</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                    {myReviews.length} Đánh giá
                  </span>
                </div>

                {myReviews.length === 0 ? (
                  <EmptyState
                    icon={<Star size={48} className="text-slate-300" />}
                    title="Chưa có đánh giá sản phẩm nào"
                    description="Hãy trải nghiệm sản phẩm và để lại nhận xét tại trang chi tiết sản phẩm."
                    actionText="Khám phá cửa hàng"
                    onAction={() => navigateTo('listing')}
                  />
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-start transition-all"
                      >
                        <div className="flex gap-4">
                          {rev.productImage && (
                            <img src={rev.productImage} alt="" className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0" />
                          )}
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900">{rev.productName || `Sản phẩm #${rev.productId}`}</h4>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                                />
                              ))}
                              <span className="text-[11px] font-bold text-slate-700 ml-1.5">{rev.rating}/5 Sao</span>
                            </div>
                            <p className="text-xs text-slate-600 pt-1 italic">"{rev.comment}"</p>
                            <span className="text-[10px] text-slate-400 block pt-1">Ngày gửi: {rev.createdAt}</span>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full shrink-0">
                          ✓ Đã hiển thị
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 10. WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-6">Sản phẩm yêu thích đã lưu</h3>
                {wishlist.length === 0 ? (
                  <EmptyState
                    icon={<Heart size={48} className="text-slate-300" />}
                    title="Chưa có sản phẩm yêu thích"
                    description="Bạn chưa lưu sản phẩm nào. Hãy bấm vào biểu tượng hình trái tim trên sản phẩm để lưu lại."
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {wishlist.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={(p) => setQuickViewProduct(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Quick View Modal in Profile/Wishlist */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
