import { apiRequest } from "./api";
import { ENDPOINTS, withQuery } from "./apiConstants";
import type { OrderDto, OrderQuery } from "./dto/order.dto";
import type { PageDto } from "./dto/page.dto";

/** Orders are commercial data: every call here needs an admin access token. */
export const orderService = {
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

  getById(id: string): Promise<OrderDto> {
    return apiRequest<OrderDto>(ENDPOINTS.orders.byId(id), {
      authenticated: true,
    });
  },
};
