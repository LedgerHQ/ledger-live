import {
  findFiatCurrencyByTicker,
  getFiatCurrencyByTicker,
  type FiatCurrencyTicker,
} from "@domain/entity-currency-fiat";

const UNSUPPORTED_COUNTERVALUE_FIAT = getFiatCurrencyByTicker("USD").ticker;

/** An unknown ticker reads as USD, so the balance port reports it unavailable instead of mixing currencies. */
export function resolveAnalyticsFiatCurrencyId(ticker: string): FiatCurrencyTicker {
  return findFiatCurrencyByTicker(ticker)?.ticker ?? UNSUPPORTED_COUNTERVALUE_FIAT;
}
