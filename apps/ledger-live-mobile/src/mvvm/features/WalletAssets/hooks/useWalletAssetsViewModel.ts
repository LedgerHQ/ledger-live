import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import {
  MAX_ASSETS_TO_DISPLAY,
  MAX_STABLECOINS_TO_DISPLAY,
} from "LLM/features/WalletAssets/constants";
import { usePortfolioSectionActions } from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";

interface WalletAssetsViewModelResult {
  hasMore: boolean;
  onPressShowAll: () => void;
  shouldAddBottomPadding: boolean;
  shouldDisplayAssetSection: boolean;
}

export function useWalletAssetsViewModel(): WalletAssetsViewModelResult {
  const { onPressShowAll } = usePortfolioSectionActions(false, "all");
  const { categorizedAssets } = useCategorizedAssetsFromPortfolio();
  const { walletCardsDisplayed } = useDynamicContent();
  const { shouldDisplayOperationsList, shouldDisplayAssetSection, shouldDisplayGraphRework } =
    useWalletFeaturesConfig("mobile");

  const hasMore = useMemo(
    () =>
      categorizedAssets.cryptos.length > MAX_ASSETS_TO_DISPLAY ||
      categorizedAssets.stablecoins.length > MAX_STABLECOINS_TO_DISPLAY,
    [categorizedAssets],
  );

  // Tx History in header: extra space under the last block — Accounts when carousel is absent and
  // nothing is rendered below (no allocations row when graph rework is off).
  return {
    hasMore,
    onPressShowAll,
    shouldAddBottomPadding:
      shouldDisplayOperationsList && walletCardsDisplayed.length === 0 && shouldDisplayGraphRework,
    shouldDisplayAssetSection,
  };
}
