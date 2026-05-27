import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import type { DistributionItem } from "@ledgerhq/types-live";

export function useShouldDisplayAssetPnl(distributionItem: DistributionItem): boolean {
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("desktop");
  return isPnlFlagOn && distributionItem.accounts.length > 0;
}
