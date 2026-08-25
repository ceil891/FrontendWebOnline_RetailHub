import { fetchApi } from './api';

export interface OnlinePaymentMethod {
  id: number | string;
  methodCode: string;
  methodName: string;
  type: string;
  providerType?: string;
  status: string;
  sortOrder?: number;
  logoUrl?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  transferSyntax?: string;
  merchantId?: string;
  allowOnline?: boolean;
  currency?: string;
  processingFeePct?: number;
  fixedFeeUsd?: number;
}

export const paymentMethodService = {
  async getOnlinePaymentMethods(): Promise<OnlinePaymentMethod[]> {
    try {
      const res = await fetchApi<any>('/payment-methods/online');
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (list.length > 0) return list;
    } catch (err) {
      console.warn('API /payment-methods/online failed, trying /payment-methods:', err);
      try {
        const allRes = await fetchApi<any>('/payment-methods');
        const allList = Array.isArray(allRes) ? allRes : (Array.isArray(allRes?.data) ? allRes.data : []);
        if (allList.length > 0) {
          return allList.filter((pm: any) => pm.status === 'ACTIVE' && (pm.allowOnline === undefined || pm.allowOnline === true));
        }
      } catch (errAll) {
        console.warn('API /payment-methods also failed, fallback to defaults:', errAll);
      }
    }

    // Default Fallback
    return [
      {
        id: 1,
        methodCode: 'COD',
        methodName: 'Thanh toán khi nhận hàng (COD)',
        type: 'CASH',
        status: 'ACTIVE',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/2331/2331941.png',
        transferSyntax: 'COD đơn {order_code}',
      },
      {
        id: 2,
        methodCode: 'BANK_TRANSFER',
        methodName: 'Chuyển khoản Ngân hàng (VietQR)',
        type: 'BANK_TRANSFER',
        status: 'ACTIVE',
        bankName: 'MBBank (Ngân hàng Quân Đội)',
        bankAccount: '0388123456789',
        bankAccountName: 'CONG TY TNHH SMART RETAIL',
        transferSyntax: 'ONLINE {order_code}',
        logoUrl: 'https://img.vietqr.io/image/MB-0388123456789-compact2.png',
      },
      {
        id: 3,
        methodCode: 'MOMO',
        methodName: 'Ví Điện Tử MoMo',
        type: 'E_WALLET',
        status: 'ACTIVE',
        merchantId: 'MOMO_MERCHANT_01',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
      },
      {
        id: 4,
        methodCode: 'VNPAY',
        methodName: 'Cổng thanh toán VNPAY-QR',
        type: 'E_WALLET',
        status: 'ACTIVE',
        merchantId: 'VNPAY_MERCHANT_01',
        logoUrl: 'https://vnpay.vn/assets/images/logo-icon/logo-primary.svg',
      },
      {
        id: 5,
        methodCode: 'CARD',
        methodName: 'Thẻ Quốc tế VISA / MasterCard / JCB',
        type: 'CARD',
        status: 'ACTIVE',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/349/349221.png',
      }
    ];
  },

  getVietQRImageUrl(bankName: string = 'MBBank', accountNo: string = '0388123456789', amount: number = 0, memo: string = 'ONLINE'): string {
    const bankBin = bankName.toLowerCase().includes('mb') ? 'MB' :
                    bankName.toLowerCase().includes('vietcombank') ? 'VCB' :
                    bankName.toLowerCase().includes('techcombank') ? 'TCB' :
                    bankName.toLowerCase().includes('acb') ? 'ACB' : 'MB';
    
    const cleanMemo = encodeURIComponent(memo || 'ONLINE');
    return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${cleanMemo}&accountName=SMART%20RETAIL`;
  }
};
