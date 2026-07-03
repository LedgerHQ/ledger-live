import type { FiatCurrency } from "./schema";
import { getFiatCurrencyByTicker } from "./utils";
import { OFAC_FIAT_TICKERS, FALLBACK_FIAT_TICKERS } from "./constants";

/** Builds the offline fallback list: FALLBACK_FIAT_TICKERS minus OFAC-restricted entries. */
export function buildFallbackFiats(): FiatCurrency[] {
  return FALLBACK_FIAT_TICKERS.filter(t => !OFAC_FIAT_TICKERS.has(t))
    .map(ticker => getFiatCurrencyByTicker(ticker))
    .filter((c): c is FiatCurrency => c !== undefined);
}
