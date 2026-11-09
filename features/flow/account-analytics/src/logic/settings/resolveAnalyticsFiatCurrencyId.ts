import {
  findFiatCurrencyByTicker,
  getFiatCurrencyByTicker,
  type FiatCurrencyTicker,
} from "@domain/entity-currency-fiat";

const UNSUPPORTED_COUNTERVALUE_FIAT = getFiatCurrencyByTicker("USD").ticker;

export function resolveAnalyticsFiatCurrencyId(ticker: string): FiatCurrencyTicker {
  return findFiatCurrencyByTicker(ticker)?.ticker ?? UNSUPPORTED_COUNTERVALUE_FIAT;
}
