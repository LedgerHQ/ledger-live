import type { FiatCurrency } from "./schema";
import { FIAT_CURRENCIES_BY_TICKER } from "./constants";

/** Looks up a fiat currency by its ISO 4217 ticker (e.g. `"USD"`); `undefined` when unknown. */
export function getFiatCurrencyByTicker(ticker: string): FiatCurrency | undefined {
  return FIAT_CURRENCIES_BY_TICKER[ticker];
}
