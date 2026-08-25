export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
}
