import { apiRequest } from "./api";
import { ENDPOINTS, withQuery } from "./apiConstants";
import type { CreateOrderDto, OrderDto, OrderQuery } from "./dto/order.dto";
import type { PageDto, PageQuery } from "./dto/page.dto";
import type { ConfirmPaymentDto } from "./dto/payment.dto";

/** Orders are commercial data: every call here needs an access token. */
export const orderService = {
  /** The whole shop's orders. Admin only. */
  list(query: OrderQuery = {}): Promise<PageDto<OrderDto>> {
    return apiRequest<PageDto<OrderDto>>(
      withQuery(ENDPOINTS.orders.list, {
        page: query.page,
        limit: query.limit,
        status: query.status,
      }),
      { authenticated: true },
    );
  },

  /** The signed-in customer's own orders. */
  listMine(query: PageQuery = {}): Promise<PageDto<OrderDto>> {
    return apiRequest<PageDto<OrderDto>>(
      withQuery(ENDPOINTS.orders.mine, {
        page: query.page,
        limit: query.limit,
      }),
      { authenticated: true },
    );
  },

  getById(id: string): Promise<OrderDto> {
    return apiRequest<OrderDto>(ENDPOINTS.orders.byId(id), {
      authenticated: true,
    });
  },

  /** Turns the basket into an order. Customer only. */
  checkout(order: CreateOrderDto): Promise<OrderDto> {
    return apiRequest<OrderDto>(ENDPOINTS.orders.list, {
      method: "POST",
      body: order,
      authenticated: true,
    });
  },

  /**
   * Settles an order with the transaction the wallet just broadcast.
   *
   * Only the hash is sent. The shop reads the amount, the recipient and the
   * outcome back off the chain itself, so this cannot claim a payment that did
   * not happen.
   */
  confirmPayment(id: string, transactionHash: string): Promise<OrderDto> {
    return apiRequest<OrderDto>(ENDPOINTS.orders.payment(id), {
      method: "POST",
      body: { transactionHash } satisfies ConfirmPaymentDto,
      authenticated: true,
    });
  },
};
