import type { DistributionItem } from "@ledgerhq/types-live";

export function useShouldDisplayAssetPnl(distributionItem: DistributionItem | undefined): boolean {
  return !!distributionItem && distributionItem.accounts.length > 0;
}
