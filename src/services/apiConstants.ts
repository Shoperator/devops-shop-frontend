/** Base URL of the shop backend. Injected per deployment by the Shop operator. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const API_PREFIX = "/api/v1";

export const AUTH_TOKEN_KEY = "shop_access_token";

export const ENDPOINTS = {
  auth: {
    login: `${API_PREFIX}/auth/login`,
    register: `${API_PREFIX}/auth/register`,
    me: `${API_PREFIX}/auth/me`,
  },
  articles: {
    all: `${API_PREFIX}/articles`,
    byId: (id: string) => `${API_PREFIX}/articles/${id}`,
  },
  orders: {
    all: `${API_PREFIX}/orders`,
    mine: `${API_PREFIX}/orders/me`,
    byId: (id: string) => `${API_PREFIX}/orders/${id}`,
  },
} as const;
