import type { OrderStatus } from "@/services/dto/order.dto";

export function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusChipClass(status: OrderStatus): string {
  switch (status) {
    case "PAID":
      return "chip chip-success";
    case "PENDING":
      return "chip chip-pending";
    default:
      return "chip chip-danger";
  }
}
