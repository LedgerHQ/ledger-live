import type { DistributionItem } from "@ledgerhq/types-live";

export type PortfolioSectionViewModel = Readonly<{
  visible: boolean;
}>;

export function usePortfolioSectionViewModel(
  distributionItem: DistributionItem,
): PortfolioSectionViewModel {
  return {
    visible: distributionItem.accounts.length > 0,
  };
}
