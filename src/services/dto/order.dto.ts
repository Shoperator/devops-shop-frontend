import type { PageQuery } from "./page.dto";

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "FAILED";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "PAID",
  "CANCELLED",
  "FAILED",
];

/**
 * A line of an order as it was at purchase time. The name and unit price are a
 * snapshot, so renaming or repricing an article never rewrites order history.
 */
export interface OrderItemDto {
  articleId: string;
  articleName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderBuyerDto {
  id: string;
  username: string;
  displayName: string;
}

/** Mirrors `OrderResponseDto` on the backend. */
export interface OrderDto {
  id: string;
  buyerId: string;
  buyer: OrderBuyerDto | null;
  items: OrderItemDto[];
  total: number;
  currency: string;
  status: OrderStatus;
  walletAddress: string | null;
  transactionHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderQuery extends PageQuery {
  status?: OrderStatus;
}
