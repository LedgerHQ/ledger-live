import type { FiatCurrency } from "./schema";
import { findFiatCurrencyByTicker, isSanctionedFiatTicker } from "./utils";
import { FALLBACK_FIAT_TICKERS } from "./constants";

/** Builds the offline fallback list: FALLBACK_FIAT_TICKERS minus OFAC-restricted entries. */
export function buildFallbackFiats(): FiatCurrency[] {
  return FALLBACK_FIAT_TICKERS.filter(t => !isSanctionedFiatTicker(t))
    .map(ticker => findFiatCurrencyByTicker(ticker))
    .filter((c): c is FiatCurrency => c !== undefined);
}
