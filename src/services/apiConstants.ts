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
} as const;
