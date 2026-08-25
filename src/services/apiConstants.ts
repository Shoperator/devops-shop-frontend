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
} as const;
