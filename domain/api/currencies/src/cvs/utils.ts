import { getFiatCurrencyByTicker, type FiatCurrency } from "@domain/entity-currency-fiat";
import { isOfacCurrency } from "./internals";

/**
 * Resolves the raw list of supported fiat tickers returned by the Countervalues
 * Service into {@link FiatCurrency} entities.
 *
 * Tickers unknown to {@link getFiatCurrencyByTicker} and OFAC-sanctioned ones are
 * dropped. This is the Zod-first replacement for the resolve+filter logic that
 * lived in `libs/ledger-live-common/src/currencies/support.ts`.
 */
export function resolveSupportedFiats(tickers: string[]): FiatCurrency[] {
  const resolved: FiatCurrency[] = [];
  const seen = new Set<string>();
  for (const ticker of tickers) {
    if (isOfacCurrency(ticker)) continue;
    const currency = getFiatCurrencyByTicker(ticker);
    if (currency && !seen.has(currency.id)) {
      seen.add(currency.id);
      resolved.push(currency);
    }
  }
  return resolved;
}
