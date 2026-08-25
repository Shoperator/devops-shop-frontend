export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "FAILED";

export interface OrderItemDto {
  articleId: string;
  articleName: string;
  unitPrice: number;
  quantity: number;
}

/** Mirrors `OrderResponseDto` on the backend. */
export interface OrderDto {
  id: string;
  buyerId: string;
  items: OrderItemDto[];
  total: number;
  currency: string;
  status: OrderStatus;
  walletAddress: string | null;
  transactionHash: string | null;
  createdAt: string;
}

export interface CreateOrderItemDto {
  articleId: string;
  quantity: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  walletAddress?: string;
}
