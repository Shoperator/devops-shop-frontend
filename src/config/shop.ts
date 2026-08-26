import { env } from "next-runtime-env";

/**
 * Shops are deployed dynamically by ShopHub, so the shop identity comes from
 * the environment.
 *
 * These are functions rather than constants on purpose. One image is built for
 * every shop, with no env set, so anything read at module scope would freeze
 * the fallback below into the bundle. `env()` reads `process.env` on the server
 * and the `PublicEnvScript` payload in the browser, both at render time, so the
 * value the operator sets on the container is the one that shows up.
 */
export function getShopName(): string {
  return env("NEXT_PUBLIC_SHOP_NAME") ?? "Shop";
}

export function getShopTagline(): string {
  return (
    env("NEXT_PUBLIC_SHOP_TAGLINE") ??
    "Browse the catalogue, fill your cart and pay in crypto — no card, no sign-up forms, no waiting."
  );
}
