import * as currencies from "./currencies";
import type { FiatCurrency } from "./schema";

/**
 * Pre-built registry of all known fiat currencies, keyed by currency id.
 */
export const FIAT_CURRENCIES_REGISTRY: Record<string, FiatCurrency> = Object.fromEntries(
  Object.values(currencies)
    .filter((c): c is FiatCurrency => Boolean(c))
    .map(c => [c.id, c]),
);

/** All known fiat currency ids as a constant array. */
export const FIAT_CURRENCIES_IDS = Object.values(FIAT_CURRENCIES_REGISTRY).map(c => c.id);

/**
 * Pre-built registry of all known fiat currencies, keyed by ISO 4217 ticker.
 * Useful to resolve currencies coming from APIs that key by ticker.
 */
export const FIAT_CURRENCIES_BY_TICKER: Record<string, FiatCurrency> = Object.fromEntries(
  Object.values(FIAT_CURRENCIES_REGISTRY).map(c => [c.ticker, c]),
);

/** Resolves a fiat currency by its ticker (e.g. `"USD"`), or `undefined` when unknown. */
export function getFiatCurrencyByTicker(ticker: string): FiatCurrency | undefined {
  return FIAT_CURRENCIES_BY_TICKER[ticker];
}
