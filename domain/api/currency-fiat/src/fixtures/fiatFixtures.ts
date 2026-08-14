import { findFiatCurrencyByTicker, type FiatCurrency } from "@domain/entity-currency-fiat";

// Shared test fixtures. Not re-exported from the package barrel; imported only by `*.test.ts`.

/** Helper that resolves a registry fiat by ticker for assertions; throws if the seed is missing. */
export function fiatByTicker(ticker: string): FiatCurrency {
  const currency = findFiatCurrencyByTicker(ticker);
  if (!currency) throw new Error(`fixture ticker not in registry: ${ticker}`);
  return currency;
}

/** Canonical Countervalues Service `/v3/supported/fiat` response. */
export const mockSupportedFiatsResponse: string[] = ["USD", "EUR", "GBP"];
