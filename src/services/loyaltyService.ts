import { fetchApi } from './api';

export interface ApiLoyaltyTier {
  id?: number;
  tierCode: string;
  tierName: string;
  minPoints?: number;
  maxPoints?: number;
  minSpend?: number;
  maxSpend?: number;
  discountPercent?: number;
  pointMultiplier?: number;
  description?: string;
  benefits?: string;
  isDefault?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

export interface MemberTierInfo {
  tierCode: string;
  tierName: string;
  badgeIcon: string;
  badgeBgClass: string;
  badgeTextClass: string;
  minSpend: number;
  nextTierName?: string;
  nextTierMinSpend?: number;
  benefits: string[];
}

export const LOYALTY_TIERS: MemberTierInfo[] = [
  {
    tierCode: 'NEW',
    tierName: 'Thành viên mới',
    badgeIcon: '🟢',
    badgeBgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    badgeTextClass: 'text-emerald-400',
    minSpend: 0,
    nextTierName: 'Hạng Đồng',
    nextTierMinSpend: 1000000,
    benefits: ['Tài khoản khách hàng chính thức', 'Nhận thông báo ưu đãi độc quyền']
  },
  {
    tierCode: 'BRONZE',
    tierName: 'Hạng Đồng',
    badgeIcon: '🟤',
    badgeBgClass: 'bg-amber-700/20 border-amber-600/30 text-amber-300',
    badgeTextClass: 'text-amber-400',
    minSpend: 1000000,
    nextTierName: 'Hạng Bạc',
    nextTierMinSpend: 5000000,
    benefits: ['Tích điểm 1% trên tổng đơn hàng', 'Quà tặng khi đạt mốc hạng Đồng']
  },
  {
    tierCode: 'SILVER',
    tierName: 'Hạng Bạc',
    badgeIcon: '⚪',
    badgeBgClass: 'bg-slate-300/20 border-slate-300/30 text-slate-200',
    badgeTextClass: 'text-slate-200',
    minSpend: 5000000,
    nextTierName: 'Hạng Vàng',
    nextTierMinSpend: 15000000,
    benefits: ['Tích điểm 2% trên tổng đơn hàng', 'Voucher sinh nhật 100.000 đ', 'Ưu tiên hỗ trợ']
  },
  {
    tierCode: 'GOLD',
    tierName: 'Hạng Vàng',
    badgeIcon: '🟡',
    badgeBgClass: 'bg-amber-400/20 border-amber-400/40 text-amber-300',
    badgeTextClass: 'text-amber-300',
    minSpend: 15000000,
    nextTierName: 'Hạng Bạch Kim',
    nextTierMinSpend: 30000000,
    benefits: ['Tích điểm 3% trên tổng đơn hàng', 'Miễn phí vận chuyển mọi đơn', 'Voucher sinh nhật 300.000 đ']
  },
  {
    tierCode: 'PLATINUM',
    tierName: 'Hạng Bạch Kim',
    badgeIcon: '🔷',
    badgeBgClass: 'bg-sky-400/20 border-sky-400/40 text-sky-300',
    badgeTextClass: 'text-sky-300',
    minSpend: 30000000,
    nextTierName: 'Hạng Kim Cương',
    nextTierMinSpend: 60000000,
    benefits: ['Tích điểm 4% trên tổng đơn hàng', 'Tổng đài chăm sóc ưu tiên 24/7', 'Voucher sinh nhật 500.000 đ']
  },
  {
    tierCode: 'DIAMOND',
    tierName: 'Hạng Kim Cương',
    badgeIcon: '💎',
    badgeBgClass: 'bg-indigo-400/20 border-indigo-400/40 text-indigo-300',
    badgeTextClass: 'text-indigo-300',
    minSpend: 60000000,
    benefits: ['Tích điểm 5% trên tổng đơn hàng', 'Quà tặng VIP độc quyền hàng năm', 'Voucher sinh nhật 1.000.000 đ', 'Trợ lý hỗ trợ riêng']
  }
];

function getBadgeStyle(code: string) {
  switch (code.toUpperCase()) {
    case 'NEW':
      return { badgeIcon: '🟢', badgeBgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', badgeTextClass: 'text-emerald-400' };
    case 'BRONZE':
      return { badgeIcon: '🟤', badgeBgClass: 'bg-amber-700/20 border-amber-600/30 text-amber-300', badgeTextClass: 'text-amber-400' };
    case 'SILVER':
      return { badgeIcon: '⚪', badgeBgClass: 'bg-slate-300/20 border-slate-300/30 text-slate-200', badgeTextClass: 'text-slate-200' };
    case 'GOLD':
      return { badgeIcon: '🟡', badgeBgClass: 'bg-amber-400/20 border-amber-400/40 text-amber-300', badgeTextClass: 'text-amber-300' };
    case 'PLATINUM':
      return { badgeIcon: '🔷', badgeBgClass: 'bg-sky-400/20 border-sky-400/40 text-sky-300', badgeTextClass: 'text-sky-300' };
    case 'DIAMOND':
      return { badgeIcon: '💎', badgeBgClass: 'bg-indigo-400/20 border-indigo-400/40 text-indigo-300', badgeTextClass: 'text-indigo-300' };
    default:
      return { badgeIcon: '⭐', badgeBgClass: 'bg-slate-500/20 border-slate-500/30 text-slate-300', badgeTextClass: 'text-slate-300' };
  }
}

export function mapApiTierToMemberTier(t: ApiLoyaltyTier): MemberTierInfo {
  const style = getBadgeStyle(t.tierCode || '');
  const minSpend = t.minSpend !== undefined && t.minSpend !== null
    ? Number(t.minSpend)
    : (t.minPoints ? t.minPoints * 10000 : 0);

  const rawBenefits = t.benefits ? t.benefits.split(';').map(b => b.trim()).filter(Boolean) : [];
  const benefits = rawBenefits.length > 0 ? rawBenefits : [t.description || 'Quyền lợi dành cho thành viên'];

  return {
    tierCode: t.tierCode,
    tierName: t.tierName,
    badgeIcon: style.badgeIcon,
    badgeBgClass: style.badgeBgClass,
    badgeTextClass: style.badgeTextClass,
    minSpend,
    benefits
  };
}

export async function getLoyaltyTiersFromApi(): Promise<MemberTierInfo[]> {
  try {
    const rawData = await fetchApi<ApiLoyaltyTier[]>('/crm/tiers');
    if (Array.isArray(rawData) && rawData.length > 0) {
      const sorted = [...rawData].sort((a, b) => {
        const spendA = a.minSpend ?? (a.minPoints ? a.minPoints * 10000 : 0);
        const spendB = b.minSpend ?? (b.minPoints ? b.minPoints * 10000 : 0);
        return spendA - spendB;
      });

      const mapped: MemberTierInfo[] = sorted.map((t, idx) => {
        const next = sorted[idx + 1];
        const item = mapApiTierToMemberTier(t);
        if (next) {
          item.nextTierName = next.tierName;
          item.nextTierMinSpend = next.minSpend ?? (next.minPoints ? next.minPoints * 10000 : 0);
        }
        return item;
      });

      return mapped;
    }
  } catch (err) {
    console.warn('Could not fetch loyalty tiers from backend API, using fallback data:', err);
  }
  return LOYALTY_TIERS;
}

export function calculateLoyaltyInfo(totalSpend: number, tierList: MemberTierInfo[] = LOYALTY_TIERS) {
  const activeTiers = tierList.length > 0 ? tierList : LOYALTY_TIERS;
  const sortedTiers = [...activeTiers].sort((a, b) => a.minSpend - b.minSpend);
  let currentTier = sortedTiers[0];

  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    if (totalSpend >= sortedTiers[i].minSpend) {
      currentTier = sortedTiers[i];
      break;
    }
  }

  const points = Math.floor(totalSpend / 10000); // 10.000đ = 1 điểm

  let progressPercent = 100;
  let remainingToNext = 0;

  if (currentTier.nextTierMinSpend) {
    const range = currentTier.nextTierMinSpend - currentTier.minSpend;
    const currentProgress = totalSpend - currentTier.minSpend;
    progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100))) : 100;
    remainingToNext = Math.max(0, currentTier.nextTierMinSpend - totalSpend);
  }

  return {
    currentTier,
    points,
    progressPercent,
    remainingToNext
  };
}
