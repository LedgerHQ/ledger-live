import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useNonBlacklistedDistribution } from "~/hooks/useNonBlacklistedDistribution";
import type { DistributionItem } from "../../../types/distribution";

export interface DetailedAllocationViewModelResult {
  readonly list: DistributionItem[];
}

export const useDetailedAllocationViewModel = (): DetailedAllocationViewModelResult => {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("mobile");
  const list = useNonBlacklistedDistribution({
    showEmptyAccounts: true,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  return { list };
};
