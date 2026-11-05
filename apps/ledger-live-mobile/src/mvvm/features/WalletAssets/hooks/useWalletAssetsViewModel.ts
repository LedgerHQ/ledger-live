import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useServicesEntryPointsFeature } from "@features/flow-portfolio-services-entry-points";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { useBorrowLiveConfig } from "LLM/features/Borrow/hooks/useBorrowLiveConfig";
import { usePortfolioBorrowSectionViewModel } from "LLM/features/WalletAssets/views/BorrowSection/usePortfolioBorrowSectionViewModel";

interface WalletAssetsViewModelResult {
  shouldAddBottomPadding: boolean;
  shouldDisplayAssetDiscoverability: boolean;
  shouldDisplayBorrowSection: boolean;
  shouldDisplayServicesEntryPoints: boolean;
  onBorrowPress: () => void;
}

export function useWalletAssetsViewModel(): WalletAssetsViewModelResult {
  const { walletCardsDisplayed } = useDynamicContent();
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("mobile");
  const borrowConfig = useBorrowLiveConfig();
  const { isEnabled: shouldDisplayServicesEntryPoints } = useServicesEntryPointsFeature();
  const { onPress: onBorrowPress } = usePortfolioBorrowSectionViewModel();

  // Tx History in header: extra space under the last block (Accounts) when the carousel is absent,
  // since nothing is rendered below it.
  return {
    shouldAddBottomPadding: walletCardsDisplayed.length === 0,
    shouldDisplayAssetDiscoverability,
    shouldDisplayBorrowSection:
      (borrowConfig?.enabled ?? false) && !shouldDisplayServicesEntryPoints,
    shouldDisplayServicesEntryPoints,
    onBorrowPress,
  };
}
