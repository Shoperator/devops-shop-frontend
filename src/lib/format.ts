/**
 * A fixed locale on purpose. The container runs with whatever locale and time
 * zone the node happens to have, the browser with the visitor's own, and a
 * value formatted differently on the two sides is a React hydration error.
 */
const LOCALE = "en-GB";

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
});

const amountFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * `12.50 ETH` — the currency comes from the order, not from a locale table.
 *
 * The default covers the catalogue and the basket, which price articles before
 * any order exists to carry a currency.
 */
export function formatAmount(value: number, currency = "ETH"): string {
  return `${amountFormat.format(value)} ${currency}`;
}

export function formatDateTime(isoDate: string): string {
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime()) ? "—" : dateTimeFormat.format(parsed);
}

/** Order ids are uuids; the first block is enough to tell two rows apart. */
export function shortId(id: string): string {
  return id.split("-")[0];
}
