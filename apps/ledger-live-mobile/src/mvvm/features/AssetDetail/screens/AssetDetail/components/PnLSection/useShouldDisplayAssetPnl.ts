import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import type { DistributionItem } from "@ledgerhq/types-live";

export function useShouldDisplayAssetPnl(distributionItem: DistributionItem | undefined): boolean {
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("mobile");
  return isPnlFlagOn && !!distributionItem && distributionItem.accounts.length > 0;
}
