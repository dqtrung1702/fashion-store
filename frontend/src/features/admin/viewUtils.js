export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận thanh toán' },
  { value: 'confirmed', label: 'Đã xác nhận thanh toán' },
  { value: 'processing', label: 'Đang chuẩn bị hàng' },
  { value: 'shipped', label: 'Đang giao hàng' },
  { value: 'delivered', label: 'Đã giao thành công' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export const formatOrderStatusLabel = (status) =>
  ORDER_STATUS_OPTIONS.find((entry) => entry.value === status)?.label || status;

export const formatPaymentMethod = (paymentMethod, storeHoldDurationLabel) =>
  paymentMethod === 'online_followup'
    ? 'Nhận thông tin thanh toán online từ cửa hàng'
    : paymentMethod === 'store_visit_hold'
    ? `Giữ hàng ${storeHoldDurationLabel}, thanh toán tại cửa hàng`
    : paymentMethod;

export const formatFileSize = (size = 0) => {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};
