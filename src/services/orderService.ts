import type { CreateOrderDto, OrderDto } from "./dto/order.dto";
import { notImplemented } from "./notImplemented";

/**
 * Orders of the signed-in customer. The HTTP calls are added in a follow-up
 * commit; for now this file only pins down the surface the UI will talk to.
 */
export const orderService = {
  getMyOrders(): Promise<OrderDto[]> {
    return notImplemented("orderService.getMyOrders");
  },

  getById(id: string): Promise<OrderDto> {
    return notImplemented("orderService.getById", id);
  },

  create(order: CreateOrderDto): Promise<OrderDto> {
    return notImplemented("orderService.create", order.items);
  },
};
