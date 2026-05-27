import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { applySupplyFallback } from "./applySupplyFallback";

/**
 * Merge DADA-derived market data with a CoinGecko fallback for the asset ticker.
 *
 * The `||` (not `??`) fallback is intentional: DADA returns "" instead of
 * omitting the ticker when it has no data.
 */
export function applyDadaMarketFallback(
  dadaMarket: MarketCurrencyData,
  coinGeckoMarket: MarketCurrencyData | undefined,
): MarketCurrencyData {
  return applySupplyFallback(
    {
      ...dadaMarket,
      ticker: dadaMarket.ticker || coinGeckoMarket?.ticker || "",
    },
    coinGeckoMarket,
  );
}
