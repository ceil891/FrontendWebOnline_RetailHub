import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';
import { CheckCircle2, PackageCheck, Truck, ArrowRight, Download, Clock, QrCode } from 'lucide-react';
import { Order } from '../types';
import { formatCurrency } from '../utils/formatters';
import { VietQRCard } from '../components/common/VietQRCard';

export const OrderSuccessPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [lastOrder, setLastOrder] = useState<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('last_order');
    if (saved) {
      try {
        setLastOrder(JSON.parse(saved));
      } catch { }
    }
  }, []);

  const orderCode = lastOrder?.id || lastOrder?.orderCode || '#ONLINE-849201';
  const customerName = lastOrder?.shippingAddress?.fullName || lastOrder?.customerName || 'Khách hàng';
  const streetAddr = lastOrder?.shippingAddress?.street || lastOrder?.shippingAddress || 'Địa chỉ giao hàng';
  const orderTotal = lastOrder?.total || lastOrder?.totalAmount || 0;
  const paymentMethod = lastOrder?.paymentMethod || 'COD';
  const isBankTransfer = paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'VIETQR';

  return (
    <div className="animate-fade-in py-12 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
      
      {/* Success Banner */}
      <div className="inline-flex p-5 bg-emerald-100 text-emerald-600 rounded-full animate-bounce">
        <CheckCircle2 size={56} />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Cảm ơn bạn đã đặt hàng!
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Đơn hàng Online của bạn đã được ghi nhận vào hệ thống. {isBankTransfer ? 'Vui lòng quét mã VietQR bên dưới để hoàn tất thanh toán chuyển khoản.' : 'Đơn hàng đang được đóng gói và chuẩn bị giao đến bạn.'}
        </p>
      </div>

      {/* VietQR Payment Card for Bank Transfer / VietQR orders */}
      {isBankTransfer && orderTotal > 0 && (
        <div className="max-w-2xl mx-auto text-left">
          <VietQRCard
            orderCode={orderCode}
            amount={orderTotal}
            memo={orderCode}
          />
        </div>
      )}

      {/* Order Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm text-left max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mã đơn hàng</span>
            <h3 className="text-lg font-bold text-slate-900 font-mono">{orderCode}</h3>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời gian giao dự kiến</span>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Clock size={14} /> 1 - 2 Ngày làm việc
            </p>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Trạng thái xử lý đơn hàng</h4>
          <div className="relative flex items-center justify-between text-center">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-0 w-1/3 h-1 bg-slate-900 -translate-y-1/2 z-0" />

            {/* Steps */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="text-[11px] font-bold text-slate-900 mt-2">Đã đặt hàng</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-4 ring-slate-100">
                2
              </div>
              <span className="text-[11px] font-bold text-slate-900 mt-2">Đang đóng gói</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-2">Đang vận chuyển</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-2">Giao thành công</span>
            </div>
          </div>
        </div>

        {/* Address recap */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-900">Địa chỉ giao hàng:</p>
          <p>{customerName} — {streetAddr}</p>
          <p className="text-slate-500">
            Hình thức thanh toán: <strong className="text-slate-800">{isBankTransfer ? 'Chuyển khoản VietQR' : paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : paymentMethod}</strong>
          </p>
          {orderTotal > 0 && (
            <p className="text-slate-900 font-extrabold pt-1 text-sm">Tổng thanh toán: <span className="text-emerald-600">{formatCurrency(orderTotal)}</span></p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Button onClick={() => navigateTo('orders', undefined, orderCode)} variant="primary" size="lg">
          <PackageCheck size={18} /> Theo dõi & Lịch sử đơn hàng
        </Button>
        <Button onClick={() => navigateTo('home')} variant="outline" size="lg">
          Tiếp tục mua sắm <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
};
