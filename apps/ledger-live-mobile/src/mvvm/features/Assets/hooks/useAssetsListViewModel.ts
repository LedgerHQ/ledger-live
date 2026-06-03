import { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFocusEffect } from "@react-navigation/native";
import { GestureResponderEvent } from "react-native";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useNonBlacklistedDistribution } from "~/hooks/useNonBlacklistedDistribution";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";

export interface Props {
  sourceScreenName?: ScreenName;
  isSyncEnabled?: boolean;
  limitNumberOfAssets?: number;
  onContentChange?: (width: number, height: number) => void;
}

const useAssetsListViewModel = ({
  isSyncEnabled = false,
  limitNumberOfAssets,
  onContentChange,
}: Props) => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("mobile");
  const { openFromAsset } = useAssetDetailNavigation();

  const filteredDistribution = useNonBlacklistedDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const assetsToDisplay = useMemo(
    () =>
      filteredDistribution
        .filter(({ currency }) => !blacklistedTokenIdsSet.has(currency.id))
        .slice(0, limitNumberOfAssets),
    [filteredDistribution, blacklistedTokenIdsSet, limitNumberOfAssets],
  );

  const onItemPress = useCallback(
    (asset: Asset, _uiEvent: GestureResponderEvent) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: "Assets",
      });

      openFromAsset({
        currency: asset.currency,
        source: "assets",
        isPlaceholder: asset.isPlaceholder,
        marketId: asset.marketId,
      });
    },
    [openFromAsset],
  );

  return {
    assetsToDisplay,
    isSyncEnabled,
    limitNumberOfAssets,
    onItemPress,
    onContentChange,
  };
};

export default useAssetsListViewModel;
