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
 * Registry of all known fiat currencies, keyed by ISO 4217 ticker (e.g. `"USD"`).
 * Tickers are unique across the registry, so no entry is shadowed.
 */
export const FIAT_CURRENCIES_BY_TICKER: Record<string, FiatCurrency> = Object.fromEntries(
  Object.values(FIAT_CURRENCIES_REGISTRY).map(c => [c.ticker, c]),
);

/**
 * ISO 4217 tickers of fiat currencies restricted under OFAC sanctions programs.
 * Any ticker in this set is excluded from the supported-fiats list.
 */
export const OFAC_FIAT_TICKERS: ReadonlySet<string> = new Set([
  "AFN",
  "BYN",
  "CUC",
  "CUP",
  "IRR",
  "IQD",
  "KPW",
  "RUB",
  "SDG",
  "SYP",
  "MMK",
]);

/**
 * Ordered list of tickers used as the offline fallback when the CVS endpoint
 * is unreachable. Mirrors the default response of `/v3/supported/fiat`;
 * OFAC-restricted entries are filtered out at runtime by `buildFallbackFiats`.
 */
export const FALLBACK_FIAT_TICKERS: readonly string[] = [
  "AED",
  "AUD",
  "BHD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "UAH",
  "USD",
  "VND",
  "ZAR",
];
