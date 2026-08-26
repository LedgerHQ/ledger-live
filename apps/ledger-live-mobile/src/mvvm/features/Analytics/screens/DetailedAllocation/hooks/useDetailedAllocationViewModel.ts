import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useNonBlacklistedDistributionResult } from "~/hooks/useNonBlacklistedDistribution";
import type { DistributionItem } from "../../../types/distribution";

export interface DetailedAllocationViewModelResult {
  readonly list: DistributionItem[];
  readonly isCountervalueComplete: boolean;
  readonly isLoading: boolean;
}

export const useDetailedAllocationViewModel = (): DetailedAllocationViewModelResult => {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("mobile");
  const distribution = useNonBlacklistedDistributionResult({
    showEmptyAccounts: true,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });
  const isCountervalueComplete =
    distribution.isAvailable && distribution.countervalueComplete && !distribution.isLoading;

  return { list: distribution.list, isCountervalueComplete, isLoading: distribution.isLoading };
};
