import { apiRequest } from "./api";
import { ENDPOINTS } from "./apiConstants";
import type { PaymentConfigDto } from "./dto/payment.dto";

export const paymentService = {
  /**
   * How this shop takes payment. Unauthenticated: a payout address and a chain
   * id are public facts about a shop, so the catalogue can say what it settles
   * in before anyone signs in.
   */
  getConfig(): Promise<PaymentConfigDto> {
    return apiRequest<PaymentConfigDto>(ENDPOINTS.paymentConfig);
  },
};
