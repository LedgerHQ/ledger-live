import type { AssetDetailMarketInfo } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";

type ResolveMarketPriceSectionSourceIdParams = Readonly<{
  marketInfo: AssetDetailMarketInfo | undefined;
  distributionItem: DistributionItem | undefined;
  ledgerId: string | undefined;
}>;

/**
 * First identifier available to drive the market price block (mount + query fallbacks).
 * Order matches asset detail context: API market row, then distribution index, then ledger.
 */
export function resolveMarketPriceSectionSourceId({
  marketInfo,
  distributionItem,
  ledgerId,
}: ResolveMarketPriceSectionSourceIdParams): string | undefined {
  return marketInfo?.id ?? distributionItem?.marketId ?? distributionItem?.currency.id ?? ledgerId;
}
