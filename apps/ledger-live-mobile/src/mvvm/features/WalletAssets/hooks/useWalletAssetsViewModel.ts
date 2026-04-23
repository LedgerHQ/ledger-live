import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
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
  const {
    shouldDisplayOperationsList,
    shouldDisplayAssetSection,
    shouldDisplayGraphRework,
  } = useWalletFeaturesConfig("mobile");

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const hasMore = useMemo(() => {
    const isVisible = ({ currency }: { currency: { type: string; id: string } }) =>
      currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id);

    const cryptosCount = categorizedAssets.cryptos.filter(isVisible).length;
    const stablecoinsCount = categorizedAssets.stablecoins.filter(isVisible).length;

    return cryptosCount > MAX_ASSETS_TO_DISPLAY || stablecoinsCount > MAX_STABLECOINS_TO_DISPLAY;
  }, [categorizedAssets, blacklistedTokenIdsSet]);

  // Tx History in header: extra space under the last block — Accounts when carousel is absent and
  // nothing is rendered below (no allocations row when graph rework is off).
  return {
    hasMore,
    onPressShowAll,
    shouldAddBottomPadding:
      shouldDisplayOperationsList &&
      walletCardsDisplayed.length === 0 &&
      shouldDisplayGraphRework,
    shouldDisplayAssetSection,
  };
}
