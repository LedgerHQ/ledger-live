import type { MarketCurrency } from "@ledgerhq/live-common/market/utils/types";

type MarketCurrencyDataWithOptionalSupply = Omit<MarketCurrency, "totalSupply" | "maxSupply"> &
  Partial<Pick<MarketCurrency, "totalSupply" | "maxSupply">>;

/**
 * Merge DADA-derived market data with a CoinGecko fallback for supply fields.
 *
 * DADA returns 0 instead of omitting missing supply fields, so the `||` (not `??`)
 * fallback is intentional: any 0 from DADA is treated as "no value" and replaced
 * by the CoinGecko value when available.
 */
export function applySupplyFallback(
  dadaMarket: MarketCurrency,
  coinGeckoMarket: MarketCurrency | undefined,
): MarketCurrency {
  const marketWithSupplyFallback: MarketCurrencyDataWithOptionalSupply = {
    ...dadaMarket,
    circulatingSupply: dadaMarket.circulatingSupply || coinGeckoMarket?.circulatingSupply || 0,
    totalSupply: dadaMarket.totalSupply || coinGeckoMarket?.totalSupply,
    maxSupply: dadaMarket.maxSupply || coinGeckoMarket?.maxSupply,
  };

  return marketWithSupplyFallback as MarketCurrency;
}
