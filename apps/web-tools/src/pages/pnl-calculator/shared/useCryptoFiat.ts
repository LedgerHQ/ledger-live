import { useMemo } from "react";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import type { FiatCurrency } from "@domain/entity-currency-fiat";

const cache = new Map<string, FiatCurrency>();

function get(ticker: string): FiatCurrency {
  const hit = cache.get(ticker);
  if (hit) return hit;
  const fiat = getFiatCurrencyByTicker(ticker);
  if (!fiat) throw new Error(`Unknown fiat currency ticker: ${ticker}`);
  cache.set(ticker, fiat);
  return fiat;
}

export function useCryptoFiat(ticker: string): FiatCurrency {
  return useMemo(() => get(ticker), [ticker]);
}
