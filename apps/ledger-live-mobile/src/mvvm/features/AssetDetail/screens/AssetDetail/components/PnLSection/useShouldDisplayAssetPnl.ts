import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import type { DistributionItem } from "@ledgerhq/types-live";

export function useShouldDisplayAssetPnl(distributionItem: DistributionItem | undefined): boolean {
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("mobile");
  return isPnlFlagOn && !!distributionItem && distributionItem.accounts.length > 0;
}
