import { useNonBlacklistedDistribution } from "~/actions/general";
import type { DistributionItem } from "../components/DistributionCard";

export interface DetailedAllocationViewModelResult {
  readonly list: DistributionItem[];
}

export const useDetailedAllocationViewModel = (): DetailedAllocationViewModelResult => {
  const list = useNonBlacklistedDistribution();

  return { list };
};
