export const COLORS = {
  primary: "#D32F2F",
  primaryDark: "#B71C1C",
  secondary: "#FFC107",
  background: "#FFF9F0",
  surface: "#FFFFFF",
  textPrimary: "#2D2424",
  textSecondary: "#5C4D4D",
  textInverse: "#FFFFFF",
  border: "#F0E6D8",
  success: "#4CAF50",
  danger: "#D32F2F",
  muted: "#9E9E9E",
};

export function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "#FFA000",
  confirmed: "#1976D2",
  delivering: "#7B1FA2",
  completed: "#388E3C",
  cancelled: "#616161",
};
