const VISIBLE_START = 6;
const VISIBLE_END = 6;

/** Shortens an address as the position view shortens the stake account. */
export function shortAddress(address: string): string {
  if (address.length <= VISIBLE_START + VISIBLE_END + 1) return address;
  return `${address.slice(0, VISIBLE_START)}…${address.slice(-VISIBLE_END)}`;
}

/** A validator APY, which the validators list gives as a fraction. */
export function formatApy(apy: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(apy);
}
