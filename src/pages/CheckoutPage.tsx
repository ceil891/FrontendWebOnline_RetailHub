import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  Plus,
  QrCode,
  Copy,
  Building2,
  Check,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { orderService } from '../services/orderService';
import { addressService, CustomerAddress } from '../services/addressService';
import { paymentMethodService, OnlinePaymentMethod } from '../services/paymentMethodService';
import { authService } from '../services/authService';
import { VietQRCard } from '../components/common/VietQRCard';
import { VietnamAddressSelect } from '../components/common/VietnamAddressSelect';
import { calculateShippingFeeByProvince } from '../data/vietnamLocations';

export const CheckoutPage: React.FC = () => {
  const { cart, total, subtotal, shippingFee, couponDiscount, clearCart } = useCart();
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  const currentUser = authService.getCurrentUser();

  // Load user profile from localStorage dynamically
  const [profileName, profilePhone, profileId] = React.useMemo(() => {
    try {
      const uInfo = localStorage.getItem('user_info') || localStorage.getItem('user_profile') || localStorage.getItem('user') || localStorage.getItem('auth_user');
      let name = currentUser?.name || '';
      let phone = currentUser?.phone || '';
      let id = currentUser?.id ? Number(currentUser.id) : undefined;
      if (uInfo) {
        const p = JSON.parse(uInfo);
        name = p.fullName || p.name || p.username || name;
        phone = p.phone || p.phoneNumber || phone;
        id = p.id || id;
      }
      return [name || 'Nguyễn Lưu Hưng', phone || '0988 123 456', id];
    } catch { }
    return ['', '', undefined];
  }, [currentUser]);

  // Saved addresses state from Backend API
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | number>('default');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Online payment methods from Backend API
  const [paymentMethods, setPaymentMethods] = useState<OnlinePaymentMethod[]>([]);
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<string>('');
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express' | 'sameday'>('standard');
  const [orderNotes, setOrderNotes] = useState('');
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const [newAddressForm, setNewAddressForm] = useState({
    recipientName: profileName,
    phoneNumber: profilePhone,
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    street: '',
    addressType: 'HOME' as 'HOME' | 'OFFICE' | 'OTHER'
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 •••• •••• 4242',
    cardHolder: profileName,
    expiry: '12/28',
    cvv: '888'
  });

  // Fetch addresses and payment methods from Backend APIs
  useEffect(() => {
    setIsLoadingAddresses(true);
    addressService.getAddresses(profileId, profilePhone).then(list => {
      setAddresses(list);
      const defaultAddr = list.find(a => a.isDefault) || list[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
      setIsLoadingAddresses(false);
    });

    setIsLoadingPayments(true);
    paymentMethodService.getOnlinePaymentMethods().then(methods => {
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedPaymentCode(methods[0].methodCode || '');
      }
      setIsLoadingPayments(false);
    });
  }, [profileId, profilePhone]);

  // Xác định tỉnh thành hiện tại từ sổ địa chỉ hoặc form nhập mới
  const activeProvince = React.useMemo(() => {
    if (selectedAddressId === 'new') {
      return newAddressForm.province || 'Thành phố Hồ Chí Minh';
    }
    const found = addresses.find(a => String(a.id) === String(selectedAddressId));
    if (found) {
      if (found.province) return found.province;
      const parts = (found.fullAddress || '').split(',');
      if (parts.length > 0) return parts[parts.length - 1].trim();
    }
    return 'Thành phố Hồ Chí Minh';
  }, [selectedAddressId, newAddressForm.province, addresses]);

  // Cước phí giao hàng tính động theo khu vực địa chỉ nhận hàng
  const baseAreaShippingFee = React.useMemo(() => {
    return calculateShippingFeeByProvince(activeProvince, subtotal);
  }, [activeProvince, subtotal]);

  const deliveryPrices = React.useMemo(() => {
    return {
      standard: baseAreaShippingFee,
      express: baseAreaShippingFee > 0 ? baseAreaShippingFee + 20000 : 20000,
      sameday: baseAreaShippingFee > 0 ? baseAreaShippingFee + 45000 : 45000
    };
  }, [baseAreaShippingFee]);

  const currentDeliveryFee = deliveryPrices[deliveryMethod];
  const finalTotal = Math.max(0, subtotal - couponDiscount + currentDeliveryFee);

  // Find currently selected online payment method object
  const activeMethodObj = paymentMethods.find(m => m.methodCode === selectedPaymentCode) || paymentMethods[0];

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    addToast('Đã sao chép', `Đã sao chép: ${text}`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cart.length === 0 || !selectedPaymentCode) return;

    setIsSubmitting(true);
    const orderCode = `ONLINE-${Math.floor(100000 + Math.random() * 900000)}`;

    let customerName = profileName;
    let customerPhone = profilePhone;
    let addressStr = '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh';

    if (selectedAddressId === 'new') {
      if (newAddressForm.recipientName) customerName = newAddressForm.recipientName;
      if (newAddressForm.phoneNumber) customerPhone = newAddressForm.phoneNumber;
      const parts = [newAddressForm.street, newAddressForm.ward, newAddressForm.district, newAddressForm.province].filter(Boolean);
      if (parts.length > 0) addressStr = parts.join(', ');

      // Save new address to backend if option is checked
      if (saveToAddressBook && newAddressForm.street) {
        addressService.createAddress({
          customerId: profileId,
          customerPhone: profilePhone,
          recipientName: customerName,
          phoneNumber: customerPhone,
          province: newAddressForm.province,
          district: newAddressForm.district,
          ward: newAddressForm.ward,
          street: newAddressForm.street,
          fullAddress: addressStr,
          addressType: newAddressForm.addressType,
          isDefault: addresses.length === 0,
        }).catch(() => {});
      }
    } else {
      const foundAddr = addresses.find(a => String(a.id) === String(selectedAddressId));
      if (foundAddr) {
        customerName = foundAddr.recipientName;
        customerPhone = foundAddr.phoneNumber;
        addressStr = foundAddr.fullAddress || `${foundAddr.street}, ${foundAddr.district}, ${foundAddr.province}`;
      }
    }

    // Thời gian đặt đơn theo giờ địa phương Việt Nam (GMT+7)
    const now = new Date();
    const localIsoDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);

    const orderPayload = {
      orderCode: orderCode,
      orderDate: localIsoDate,
      customerId: profileId,
      customerName: customerName,
      customerPhone: customerPhone,
      shippingAddress: addressStr,
      branchId: 1,
      status: 'PENDING',
      orderOrigin: 'ONLINE',
      paymentMethod: selectedPaymentCode,
      paymentMethodCode: selectedPaymentCode,
      subtotal: subtotal,
      discount: couponDiscount,
      shippingFee: currentDeliveryFee,
      total: finalTotal,
      totalAmount: finalTotal,
      note: `[ĐƠN HÀNG ONLINE FE_WebOnline] PTTT: ${selectedPaymentCode} | Người nhận: ${customerName} (${customerPhone}) - ĐC: ${addressStr} | Ghi chú: ${orderNotes || 'Không có'}`,
      details: cart.map(item => ({
        productId: Number(item.product.id),
        productVariantId: Number((item.product as any).variantId || item.product.id || 1),
        productName: item.product.name,
        image: item.product.images[0],
        quantity: item.quantity,
        unitPrice: item.product.price,
        unitPriceSnapshot: item.product.price,
      }))
    };

    try {
      await orderService.createOrder(orderPayload);
      const savedOrder = {
        ...orderPayload,
        id: orderCode,
        total: finalTotal,
        subtotal: subtotal,
        discount: couponDiscount,
        shippingFee: deliveryPrices[deliveryMethod],
        paymentMethod: selectedPaymentCode,
        shippingAddress: {
          fullName: customerName,
          phone: customerPhone,
          street: addressStr,
        },
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          image: item.product.images[0],
          price: item.product.price,
          quantity: item.quantity,
        }))
      };
      localStorage.setItem('last_order', JSON.stringify(savedOrder));
      clearCart();
      addToast('Đặt hàng Online thành công!', `Đơn hàng Online mã ${orderCode} (${selectedPaymentCode}) đã được tiếp nhận.`);
      navigateTo('success');
    } catch (err: any) {
      console.error('Lỗi khi đặt hàng:', err);
      addToast('Lỗi đặt hàng', err?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-16">
      <Breadcrumbs items={[
        { label: 'Giỏ hàng', page: 'cart' },
        { label: 'Thanh toán' }
      ]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Thanh toán đơn hàng</h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: STEP FORM */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1: Shipping Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">1</div>
                  <h3 className="text-lg font-bold text-slate-900">Địa chỉ nhận hàng</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Đã kết nối Sổ địa chỉ Backend</span>
              </div>

              {/* Dynamic Address Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(addr => {
                  const isSelected = String(selectedAddressId) === String(addr.id);
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin size={14} className={addr.addressType === 'OFFICE' ? 'text-indigo-600' : 'text-sky-600'} />
                          {addr.addressType === 'OFFICE' ? 'Văn phòng làm việc' : 'Nhà riêng'}
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full ml-1">
                              Mặc định
                            </span>
                          )}
                        </span>
                        {isSelected && <CheckCircle2 size={16} className="text-slate-900" />}
                      </div>
                      <p className="text-xs text-slate-900 font-bold">{addr.recipientName}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{addr.fullAddress}</p>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">{addr.phoneNumber}</p>
                    </div>
                  );
                })}

                {/* Add new address option */}
                <div
                  onClick={() => setSelectedAddressId('new')}
                  className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center min-h-[110px] ${
                    selectedAddressId === 'new'
                      ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <Plus size={20} className="text-slate-500 mb-1" />
                  <span className="text-xs font-bold text-slate-900">Giao tới địa chỉ mới / Tỉnh khác</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Nhập thông tin giao nhận tùy chỉnh</p>
                </div>
              </div>

              {/* Form when user chooses New Address */}
              {selectedAddressId === 'new' && (
                <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Họ và tên người nhận"
                      placeholder="Nguyễn Văn A"
                      value={newAddressForm.recipientName}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, recipientName: e.target.value })}
                      required
                    />
                    <Input
                      label="Số điện thoại người nhận"
                      placeholder="0988 123 456"
                      value={newAddressForm.phoneNumber}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  {/* Chọn Tỉnh/Thành -> Quận/Huyện -> Phường/Xã từ danh mục phân cấp */}
                  <VietnamAddressSelect
                    province={newAddressForm.province}
                    district={newAddressForm.district}
                    ward={newAddressForm.ward}
                    street={newAddressForm.street}
                    onChange={(addr) => {
                      setNewAddressForm((prev) => ({
                        ...prev,
                        province: addr.province,
                        district: addr.district,
                        ward: addr.ward,
                        street: addr.street,
                      }));
                    }}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={saveToAddressBook}
                        onChange={(e) => setSaveToAddressBook(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                      />
                      Lưu địa chỉ này vào sổ địa chỉ tài khoản của tôi
                    </label>

                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewAddressForm({ ...newAddressForm, addressType: 'HOME' })}
                        className={`px-3 py-1 rounded-full border ${newAddressForm.addressType === 'HOME' ? 'bg-slate-900 text-white font-bold' : 'border-slate-200 text-slate-600'}`}
                      >
                        Nhà riêng
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAddressForm({ ...newAddressForm, addressType: 'OFFICE' })}
                        className={`px-3 py-1 rounded-full border ${newAddressForm.addressType === 'OFFICE' ? 'bg-slate-900 text-white font-bold' : 'border-slate-200 text-slate-600'}`}
                      >
                        Văn phòng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Method */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">2</div>
                <h3 className="text-lg font-bold text-slate-900">Hình thức giao hàng</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setDeliveryMethod('standard')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === 'standard' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">Giao tiêu chuẩn</span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(deliveryPrices.standard)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">2 - 4 Ngày làm việc</p>
                </div>

                <div
                  onClick={() => setDeliveryMethod('express')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === 'express' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">Giao nhanh Express</span>
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(deliveryPrices.express)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">1 - 2 Ngày làm việc</p>
                </div>

                <div
                  onClick={() => setDeliveryMethod('sameday')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === 'sameday' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">Giao hỏa tốc</span>
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(deliveryPrices.sameday)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Nhận trong 4 tiếng</p>
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method (Connected to Backend API) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">3</div>
                  <h3 className="text-lg font-bold text-slate-900">Phương thức thanh toán</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">API Thanh toán tự động</span>
              </div>

              {/* Dynamic Payment Method Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map(pm => {
                  const isSelected = selectedPaymentCode === pm.methodCode;
                  return (
                    <div
                      key={pm.methodCode}
                      onClick={() => setSelectedPaymentCode(pm.methodCode)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                          : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {pm.logoUrl ? (
                          <img src={pm.logoUrl} alt="" className="w-6 h-6 object-contain rounded-md" />
                        ) : pm.methodCode === 'CARD' ? (
                          <CreditCard size={20} className={isSelected ? 'text-amber-400' : 'text-slate-600'} />
                        ) : (
                          <Smartphone size={20} className={isSelected ? 'text-amber-400' : 'text-slate-600'} />
                        )}
                        <div>
                          <span className="text-xs font-bold block">{pm.methodName}</span>
                          <span className={`text-[10px] block ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {pm.methodCode === 'BANK_TRANSFER' ? 'Quét mã VietQR tiện lợi' :
                             pm.methodCode === 'COD' ? 'Nhận hàng trả tiền mặt' :
                             pm.methodCode === 'MOMO' ? 'Ví MoMo an toàn' :
                             pm.methodCode === 'VNPAY' ? 'Cổng VNPay thanh toán ngay' : 'Thẻ ghi nợ / Tín dụng'}
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {!isLoadingPayments && paymentMethods.length === 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Chưa có phương thức thanh toán khả dụng. Vui lòng liên hệ cửa hàng.
                </p>
              )}

              {/* DYNAMIC PAYMENT METHOD DETAILS ACCORDING TO SELECTION */}
              {(selectedPaymentCode === 'BANK_TRANSFER' || selectedPaymentCode === 'VIETQR' || activeMethodObj?.type === 'BANK_TRANSFER' || (activeMethodObj as any)?.providerType === 'BANK_TRANSFER') && (
                <VietQRCard
                  orderCode="ONLINE"
                  amount={finalTotal}
                  bankName={activeMethodObj?.bankName}
                  accountNo={activeMethodObj?.bankAccount}
                  accountName={activeMethodObj?.bankAccountName}
                  memo={activeMethodObj?.transferSyntax?.replace('{order_code}', 'Mã đơn')}
                />
              )}

              {selectedPaymentCode === 'MOMO' && (
                <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200 flex items-center gap-4 text-xs animate-fade-in">
                  <div className="w-12 h-12 rounded-xl bg-pink-600 text-white font-bold text-xl flex items-center justify-center shrink-0">M</div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-pink-950 block">Thanh toán qua Ví điện tử MoMo</span>
                    <p className="text-pink-800 text-[11px]">Hệ thống sẽ chuyển hướng bạn sang cổng MoMo hoặc hiển thị mã QR thanh toán sau khi xác nhận đơn.</p>
                  </div>
                </div>
              )}

              {selectedPaymentCode === 'VNPAY' && (
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 flex items-center gap-4 text-xs animate-fade-in">
                  <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-bold text-xl flex items-center justify-center shrink-0">V</div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-sky-950 block">Cổng thanh toán quốc gia VNPAY-QR</span>
                    <p className="text-sky-800 text-[11px]">Hỗ trợ thanh toán nhanh bằng ứng dụng Mobile Banking của hơn 30 ngân hàng lớn tại Việt Nam.</p>
                  </div>
                </div>
              )}

              {selectedPaymentCode === 'CARD' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                  <Input
                    label="Số thẻ quốc tế (VISA / MasterCard / JCB)"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Hạn dùng (MM/YY)"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    />
                    <Input
                      label="Mã bảo mật CVV"
                      type="password"
                      maxLength={4}
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Notes */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ghi chú cho đơn hàng</h4>
              <textarea
                rows={2}
                placeholder="Ví dụ: Giao hàng trong giờ hành chính, gọi trước khi giao..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* RIGHT: SUMMARY SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Xem lại đơn hàng ({cart.length} sản phẩm)
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 text-xs">
                    <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-50" />
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-900 line-clamp-1">{item.product.name}</h5>
                      <p className="text-[11px] text-slate-400">{item.quantity}x @ {formatCurrency(item.product.price)}</p>
                    </div>
                    <span className="font-extrabold text-slate-900">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Calculation */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="font-bold text-slate-900">{formatCurrency(deliveryPrices[deliveryMethod])}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                  <span>Tổng tiền thanh toán</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                fullWidth 
                variant="primary" 
                size="lg"
                disabled={isSubmitting || cart.length === 0 || !selectedPaymentCode}
                className="disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý đơn hàng...
                  </span>
                ) : (
                  <>Xác nhận đặt hàng <ArrowRight size={18} /></>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Anti-spam submission loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white animate-fade-in">
            <div className="w-14 h-14 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">Đang xử lý khởi tạo đơn hàng...</h3>
              <p className="text-xs text-slate-300">Hệ thống đang tiếp nhận và đồng bộ kho hàng. Vui lòng không đóng trình duyệt.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
