import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Download, Building2, ShieldCheck, Smartphone, ExternalLink, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { paymentMethodService } from '../../services/paymentMethodService';

interface VietQRCardProps {
  orderCode: string;
  amount: number;
  bankName?: string;
  accountNo?: string;
  accountName?: string;
  memo?: string;
  className?: string;
  compact?: boolean;
}

export const VietQRCard: React.FC<VietQRCardProps> = ({
  orderCode,
  amount,
  bankName: propBankName,
  accountNo: propAccountNo,
  accountName: propAccountName,
  memo,
  className = '',
  compact = false,
}) => {
  const { addToast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dynamic Bank State from Admin Settings
  const [bankInfo, setBankInfo] = useState<{ bankName: string; accountNo: string; accountName: string } | null>(null);

  useEffect(() => {
    // If props were explicitly provided, use them
    if (propBankName && propAccountNo && propAccountName) {
      setBankInfo({
        bankName: propBankName,
        accountNo: propAccountNo,
        accountName: propAccountName
      });
      return;
    }

    // Otherwise, fetch latest dynamic Payment Method config from Admin API
    paymentMethodService.getOnlinePaymentMethods().then(methods => {
      const bankMethod = methods.find(m => m.methodCode === 'BANK_TRANSFER' || m.type === 'BANK_TRANSFER');
      if (bankMethod?.bankName && bankMethod.bankAccount && bankMethod.bankAccountName) {
        setBankInfo({
          bankName: bankMethod.bankName,
          accountNo: bankMethod.bankAccount,
          accountName: bankMethod.bankAccountName
        });
      }
    }).catch(() => {});
  }, [propBankName, propAccountNo, propAccountName]);

  if (!bankInfo) {
    return (
      <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 ${className}`}>
        Phương thức VietQR chưa được cấu hình tài khoản nhận tiền. Vui lòng liên hệ cửa hàng.
      </div>
    );
  }

  const effectiveBankName = bankInfo.bankName;
  const effectiveAccountNo = bankInfo.accountNo;
  const effectiveAccountName = bankInfo.accountName;

  const transferContent = memo || orderCode.replace('#', '');
  const bankBin = effectiveBankName.toLowerCase().includes('mb') ? 'MB' :
                  effectiveBankName.toLowerCase().includes('vietcombank') ? 'VCB' :
                  effectiveBankName.toLowerCase().includes('techcombank') ? 'TCB' :
                  effectiveBankName.toLowerCase().includes('acb') ? 'ACB' :
                  effectiveBankName.toLowerCase().includes('bidv') ? 'BIDV' :
                  effectiveBankName.toLowerCase().includes('vietin') ? 'CTG' : 'MB';

  const cleanAccountName = encodeURIComponent(effectiveAccountName);
  const cleanMemo = encodeURIComponent(transferContent);
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${effectiveAccountNo}-compact2.png?amount=${amount}&addInfo=${cleanMemo}&accountName=${cleanAccountName}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast('Đã sao chép', `Đã sao chép: ${text}`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `VietQR_${orderCode}.png`;
    link.target = '_blank';
    link.click();
    addToast('Tải mã QR', 'Đang tải hình ảnh mã VietQR thanh toán...');
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-lg relative overflow-hidden ${className}`}>
      {/* Decorative gradient top bar */}
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500" />

      {/* Header with VietQR Logo & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <QrCode size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Thanh toán VietQR</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                NAPAS 247 Real-time
              </span>
            </div>
            <p className="text-xs text-slate-500">Chuyển khoản 24/7 - Xử lý tự động ngay tức thì</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="Tải ảnh QR về máy"
          >
            <Download size={13} /> Tải mã QR
          </button>
        </div>
      </div>

      {/* Main Grid: QR Code & Bank Info */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-12'} gap-6 items-center`}>
        
        {/* QR Code Container */}
        <div className={`${compact ? 'col-span-1' : 'sm:col-span-5'} flex flex-col items-center justify-center text-center space-y-2.5`}>
          <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-md hover:shadow-xl transition-shadow duration-300 group">
            <img
              src={qrUrl}
              alt={`VietQR thanh toán đơn ${orderCode}`}
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl"
            />
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center pointer-events-none">
              <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">
                Quét bằng mọi App Ngân hàng
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Smartphone size={13} className="text-sky-600" /> Mở App Ngân hàng bất kỳ để quét mã
          </span>
        </div>

        {/* Transfer Details Form */}
        <div className={`${compact ? 'col-span-1' : 'sm:col-span-7'} space-y-3 text-xs`}>
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            
            {/* Bank Name */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Ngân hàng thụ hưởng:</span>
              <span className="font-extrabold text-slate-900 text-right">{effectiveBankName}</span>
            </div>

            {/* Account Number with Copy */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-slate-500 font-medium block">Số tài khoản:</span>
                <span className="font-mono font-black text-sm text-sky-700 tracking-wide">{effectiveAccountNo}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(effectiveAccountNo, 'accountNo')}
                className="px-2.5 py-1.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 rounded-xl font-bold flex items-center gap-1 text-[11px] transition-all shadow-xs"
              >
                {copiedField === 'accountNo' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copiedField === 'accountNo' ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>

            {/* Account Holder Name */}
            <div className="flex items-center justify-between py-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
              <span className="font-bold text-slate-900 uppercase">{effectiveAccountName}</span>
            </div>

            {/* Transfer Amount with Copy */}
            <div className="flex items-center justify-between py-1.5 border-t border-slate-200 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
              <div>
                <span className="text-emerald-800 font-bold block text-[11px]">Số tiền cần chuyển:</span>
                <span className="font-black text-emerald-700 text-base">{formatCurrency(amount)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(String(amount), 'amount')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 text-[11px] transition-all shadow-xs"
              >
                {copiedField === 'amount' ? <Check size={13} /> : <Copy size={13} />}
                {copiedField === 'amount' ? 'Đã chép' : 'Sao chép tiền'}
              </button>
            </div>

            {/* Transfer Syntax with Copy */}
            <div className="flex items-center justify-between py-1.5 border-t border-slate-200 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
              <div>
                <span className="text-amber-800 font-bold block text-[11px]">Nội dung chuyển khoản (Bắt buộc):</span>
                <span className="font-mono font-black text-amber-900 text-sm">{transferContent}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(transferContent, 'memo')}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1 text-[11px] transition-all shadow-xs"
              >
                {copiedField === 'memo' ? <Check size={13} /> : <Copy size={13} />}
                {copiedField === 'memo' ? 'Đã chép' : 'Sao chép nội dung'}
              </button>
            </div>

          </div>

          {/* Verification Notice */}
          <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-sky-900 flex items-start gap-2">
            <ShieldCheck size={16} className="text-sky-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Hệ thống tự động duyệt đơn ngay sau khi nhận được thông báo biến động số dư từ ngân hàng (thường từ 30 giây đến 2 phút).
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
