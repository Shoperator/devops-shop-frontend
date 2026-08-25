/**
 * Shops are deployed dynamically by ShopHub, so the shop identity comes from
 * the environment.
 */
export const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME ?? "Shop";

export const SHOP_TAGLINE =
  process.env.NEXT_PUBLIC_SHOP_TAGLINE ??
  "Browse the catalogue, fill your cart and pay in crypto — no card, no sign-up forms, no waiting.";
