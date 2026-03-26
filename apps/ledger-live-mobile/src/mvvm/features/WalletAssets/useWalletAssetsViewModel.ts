import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { usePortfolioSectionActions } from "LLM/features/WalletAssets/shared/usePortfolioSectionActions";
import { MAX_ASSETS_TO_DISPLAY } from "LLM/features/WalletAssets/views/CryptosSection/usePortfolioCryptosSectionViewModel";
import { MAX_STABLECOINS_TO_DISPLAY } from "LLM/features/WalletAssets/views/StablecoinsSection/usePortfolioStablecoinsSectionViewModel";

interface WalletAssetsViewModelResult {
  hasMore: boolean;
  onPressShowAll: () => void;
  shouldAddBottomPadding: boolean;
}

export function useWalletAssetsViewModel(): WalletAssetsViewModelResult {
  const { onPressShowAll } = usePortfolioSectionActions(false);
  const { categorizedAssets } = useCategorizedAssetsFromPortfolio();
  const { shouldDisplayOperationsList } = useWalletFeaturesConfig("mobile");

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const hasMore = useMemo(() => {
    const isVisible = ({ currency }: { currency: { type: string; id: string } }) =>
      currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id);

    const cryptosCount = categorizedAssets.cryptos.filter(isVisible).length;
    const stablecoinsCount = categorizedAssets.stablecoins.filter(isVisible).length;

    return cryptosCount > MAX_ASSETS_TO_DISPLAY || stablecoinsCount > MAX_STABLECOINS_TO_DISPLAY;
  }, [categorizedAssets, blacklistedTokenIdsSet]);

  // When the operations list section is hidden, WalletAssetsView is the last section and
  // the tab bar (rendered without safe area) would overlap the bottom content.
  return { hasMore, onPressShowAll, shouldAddBottomPadding: shouldDisplayOperationsList };
}
