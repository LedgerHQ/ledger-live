import type { DistributionItem } from "@ledgerhq/types-live";
import type { CategorizedAssets, CategorizedAssetItem } from "./types";

export function categorizeAssets(
  distribution: DistributionItem[],
  stablecoinTickers: Set<string>,
): CategorizedAssets {
  const cryptos: CategorizedAssetItem[] = [];
  const stablecoins: CategorizedAssetItem[] = [];
  const normalizedTickers = new Set([...stablecoinTickers].map(t => t.toUpperCase()));

  for (const item of distribution) {
    const enriched: CategorizedAssetItem = {
      currency: item.currency,
      balance: item.amount,
      value: item.countervalue ?? 0,
      distribution: item.distribution,
      accounts: item.accounts,
    };

    if (normalizedTickers.has(item.currency.ticker.toUpperCase())) {
      stablecoins.push(enriched);
    } else {
      cryptos.push(enriched);
    }
  }

  return { cryptos, stablecoins };
}
