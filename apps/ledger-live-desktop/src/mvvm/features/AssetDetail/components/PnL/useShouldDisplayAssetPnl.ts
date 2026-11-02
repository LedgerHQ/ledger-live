import type { DistributionItem } from "@ledgerhq/types-live";

export function useShouldDisplayAssetPnl(distributionItem: DistributionItem): boolean {
  return distributionItem.accounts.length > 0;
}
