import type { DistributionItem } from "@ledgerhq/types-live";
import type { MarketDataMap, CategorizedAssets, CategorizedAssetItem } from "./types";

export function categorizeAssets(
  distribution: DistributionItem[],
  marketData: MarketDataMap,
  stablecoinTickers: Set<string>,
): CategorizedAssets {
  const cryptos: CategorizedAssetItem[] = [];
  const stablecoins: CategorizedAssetItem[] = [];
  const normalizedTickers = new Set([...stablecoinTickers].map(t => t.toUpperCase()));

  for (const item of distribution) {
    const market = marketData[item.currency.id];
    const enriched: CategorizedAssetItem = {
      currency: item.currency,
      balance: item.amount,
      value: item.countervalue ?? 0,
      distribution: item.distribution,
      accounts: item.accounts,
      price: market?.price,
      priceChangePercentage24h: market?.priceChangePercentage24h,
    };

    if (normalizedTickers.has(item.currency.ticker.toUpperCase())) {
      stablecoins.push(enriched);
    } else {
      cryptos.push(enriched);
    }
  }

  return { cryptos, stablecoins };
}
