import {
  findFiatCurrencyByTicker,
  OFAC_FIAT_TICKERS,
  type FiatCurrency,
} from "@domain/entity-currency-fiat";

/**
 * Resolves the Countervalues Service supported-fiat tickers to {@link FiatCurrency} entities.
 *
 * For each ticker (normalized to upper-case): drops OFAC-sanctioned currencies, resolves the
 * entity from the static `@domain/entity-currency-fiat` registry (dropping tickers the registry
 * does not know yet), and de-duplicates by currency id while preserving order.
 */
export function resolveSupportedFiats(tickers: string[]): FiatCurrency[] {
  const seen = new Set<string>();
  const resolved: FiatCurrency[] = [];

  for (const ticker of tickers) {
    const upper = ticker.toUpperCase();
    if (OFAC_FIAT_TICKERS.has(upper)) continue;

    const currency = findFiatCurrencyByTicker(upper);
    if (!currency || seen.has(currency.id)) continue;

    seen.add(currency.id);
    resolved.push(currency);
  }

  return resolved;
}
