import { useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import { toAsset } from "LLM/utils/assetUtils";
import { CryptoScreenViewData, CryptoVariant } from "./types";
import { selectAssetList } from "./utils";

interface UseCryptoViewModelParams {
  sourceScreenName?: ScreenName;
  variant?: CryptoVariant;
}

const TRACKING_TYPE_BY_VARIANT: Record<CryptoVariant, "crypto" | "stable" | "stocks" | undefined> =
  {
    stablecoin: "stable",
    crypto: "crypto",
    stocks: "stocks",
    all: undefined,
  };

const useCryptoViewModel = ({
  sourceScreenName,
  variant,
}: UseCryptoViewModelParams): CryptoScreenViewData => {
  const { t } = useTranslation();
  const { openFromAsset } = useAssetDetailNavigation();

  const {
    categorizedAssets,
    isLoadingStablecoinTickers,
    isStablecoinTickersError,
    isLoadingStocks,
    isStocksError,
  } = useCategorizedAssetsFromPortfolio();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const resolvedVariant: CryptoVariant = variant ?? "all";

  const dependsOnStocks = resolvedVariant === "stocks" || resolvedVariant === "all";
  const dependsOnStablecoins = resolvedVariant !== "stocks";
  const isLoading =
    (dependsOnStablecoins && isLoadingStablecoinTickers) || (dependsOnStocks && isLoadingStocks);
  const hasError =
    (dependsOnStablecoins && isStablecoinTickersError) || (dependsOnStocks && isStocksError);

  const assetsToDisplay = useMemo(
    (): Asset[] => selectAssetList(categorizedAssets, resolvedVariant).map(toAsset),
    [categorizedAssets, resolvedVariant],
  );

  const onItemPress = useCallback(
    (asset: Asset) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: TRACKING_TYPE_BY_VARIANT[resolvedVariant],
      });

      openFromAsset({
        currency: asset.currency,
        source: `crypto_${resolvedVariant}_list`,
        isPlaceholder: asset.isPlaceholder,
        marketId: asset.marketId,
      });
    },
    [openFromAsset, resolvedVariant],
  );

  const trackingType = TRACKING_TYPE_BY_VARIANT[resolvedVariant];

  return {
    assetsToDisplay,
    onItemPress,
    isLoading,
    error: hasError ? new Error(t("crypto.errorState")) : null,
    sourceScreenName,
    variant: resolvedVariant,
    trackingType,
  };
};

export default useCryptoViewModel;
