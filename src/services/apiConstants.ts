import { env } from "next-runtime-env";

/**
 * Base URL of the shop backend, empty meaning "this page's origin".
 *
 *
 *     https://shop1.example  /            → shop frontend
 *     https://shop1.example  /api/v1/...  → shop backend
 *
 * - one image serves every shop, with no per-shop address injected into it
 * - the requests are same-origin, so no CORS is involved
 *
 * This holds only because every request is made from the browser: the fetches
 * live in effects and event handlers, and `apiRequest` reads the token from
 * `localStorage`. A relative URL has nothing to resolve against in Node, so a
 * call made while a page is being server-rendered would throw.
 *
 * `NEXT_PUBLIC_API_URL` remains an override for pointing this app at a backend
 * on another origin. Local development does not need it: the dev server
 * routes `/api` to the backend itself, see `next.config.ts`.
 *
 */
export function getApiBaseUrl(): string {
  return env("NEXT_PUBLIC_API_URL") ?? "";
}

export const API_PREFIX = "/api/v1";

export const AUTH_TOKEN_KEY = "shop_access_token";

export const ENDPOINTS = {
  auth: {
    login: `${API_PREFIX}/auth/login`,
    register: `${API_PREFIX}/auth/register`,
    me: `${API_PREFIX}/auth/me`,
  },
  articles: {
    list: `${API_PREFIX}/articles`,
    byId: (id: string) => `${API_PREFIX}/articles/${encodeURIComponent(id)}`,
  },
  orders: {
    /** Also the checkout endpoint: POST turns a basket into an order. */
    list: `${API_PREFIX}/orders`,
    mine: `${API_PREFIX}/orders/mine`,
    byId: (id: string) => `${API_PREFIX}/orders/${encodeURIComponent(id)}`,
  },
} as const;

/** Mirrors MAX_PAGE_SIZE on the backend; a larger `limit` is rejected there. */
export const MAX_PAGE_SIZE = 100;

/**
 * Appends the query parameters that are actually set. Skipping the empty ones
 * keeps the URL — and with it the Prometheus route label — stable.
 */
export function withQuery(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const queryString = search.toString();
  return queryString === "" ? path : `${path}?${queryString}`;
}
