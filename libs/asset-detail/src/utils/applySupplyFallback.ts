import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";

type MarketCurrencyDataWithOptionalSupply = Omit<MarketCurrencyData, "totalSupply" | "maxSupply"> &
  Partial<Pick<MarketCurrencyData, "totalSupply" | "maxSupply">>;

/**
 * Merge DADA-derived market data with a CoinGecko fallback for supply fields.
 *
 * DADA returns 0 instead of omitting missing supply fields, so the `||` (not `??`)
 * fallback is intentional: any 0 from DADA is treated as "no value" and replaced
 * by the CoinGecko value when available.
 */
export function applySupplyFallback(
  dadaMarket: MarketCurrencyData,
  coinGeckoMarket: MarketCurrencyData | undefined,
): MarketCurrencyData {
  const marketWithSupplyFallback: MarketCurrencyDataWithOptionalSupply = {
    ...dadaMarket,
    circulatingSupply: dadaMarket.circulatingSupply || coinGeckoMarket?.circulatingSupply || 0,
    totalSupply: dadaMarket.totalSupply || coinGeckoMarket?.totalSupply,
    maxSupply: dadaMarket.maxSupply || coinGeckoMarket?.maxSupply,
  };

  return marketWithSupplyFallback as MarketCurrencyData;
}
