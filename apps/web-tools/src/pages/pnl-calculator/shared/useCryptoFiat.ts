import { useMemo } from "react";
import { getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";

const cache = new Map<string, FiatCurrency>();

function get(ticker: string): FiatCurrency {
  const hit = cache.get(ticker);
  if (hit) return hit;
  const fiat = getFiatCurrencyByTicker(ticker);
  cache.set(ticker, fiat);
  return fiat;
}

export function useCryptoFiat(ticker: string): FiatCurrency {
  return useMemo(() => get(ticker), [ticker]);
}
