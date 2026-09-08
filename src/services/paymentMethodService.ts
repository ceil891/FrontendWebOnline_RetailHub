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

    // Không được hiển thị dữ liệu giả khi cấu hình thanh toán chưa sẵn sàng.
    return [];
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
