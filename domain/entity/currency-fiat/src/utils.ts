import type { FiatCurrency } from "./schema";
import { FIAT_CURRENCIES_BY_TICKER, FIAT_CURRENCIES_REGISTRY } from "./constants";

/** Looks up a fiat currency by its ISO 4217 ticker (e.g. `"USD"`); `undefined` when unknown. */
export function findFiatCurrencyByTicker(ticker: string): FiatCurrency | undefined {
  return Object.hasOwn(FIAT_CURRENCIES_BY_TICKER, ticker)
    ? FIAT_CURRENCIES_BY_TICKER[ticker]
    : undefined;
}

/** Looks up a fiat currency by its ISO 4217 ticker, throwing when unknown. */
export function getFiatCurrencyByTicker(ticker: string): FiatCurrency {
  const currency = findFiatCurrencyByTicker(ticker);
  if (!currency) throw new Error(`fiat currency "${ticker}" not found`);
  return currency;
}

/** All known fiat currencies. */
export function listFiatCurrencies(): FiatCurrency[] {
  return Object.values(FIAT_CURRENCIES_REGISTRY);
}

/** Whether a fiat currency ISO 4217 ticker is known. */
export function hasFiatCurrencyTicker(ticker: string): boolean {
  return Object.hasOwn(FIAT_CURRENCIES_BY_TICKER, ticker);
}
