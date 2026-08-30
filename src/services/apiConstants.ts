import { env } from "next-runtime-env";

/**
 * Base URL of the shop backend. Injected per deployment by the Shop operator.
 *
 * Read through `env()` on every call instead of `process.env.NEXT_PUBLIC_*` at
 * module scope: Next inlines `NEXT_PUBLIC_` reads at build time, and the image
 * is built once for all shops with no env set, so a constant here would ship
 * the localhost fallback and ignore whatever the operator sets at runtime.
 */
export function getApiBaseUrl(): string {
  return env("NEXT_PUBLIC_API_URL") ?? "http://localhost:3000";
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
    list: `${API_PREFIX}/orders`,
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
