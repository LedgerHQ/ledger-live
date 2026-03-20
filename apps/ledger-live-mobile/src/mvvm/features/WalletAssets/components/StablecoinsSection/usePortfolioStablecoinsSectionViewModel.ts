import { useCallback, useMemo } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import { useDefaultAssetsByCategory } from "LLM/hooks/useDefaultAssetsByCategory";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";

export const MAX_STABLECOINS_TO_DISPLAY = 6;
export const EMPTY_STATE_MAX_STABLECOINS = 2;

export interface PortfolioStablecoinsSectionViewModelResult {
  assetsCount: number;
  hasMore: boolean;
  assetsToDisplay: Asset[];
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

interface UsePortfolioStablecoinsSectionViewModelOptions {
  isEmptyState?: boolean;
  isReadOnly?: boolean;
}

const toAsset = (item: CategorizedAssetItem): Asset => ({
  currency: item.currency,
  accounts: item.accounts,
  amount: item.balance,
  countervalue: item.value,
  distribution: item.distribution,
  isPlaceholder: false,
});

const usePortfolioStablecoinsSectionViewModel = ({
  isEmptyState = false,
  isReadOnly = false,
}: UsePortfolioStablecoinsSectionViewModelOptions = {}): PortfolioStablecoinsSectionViewModelResult => {
  const isAccountListUIEnabled = useFeature("llmAccountListUI")?.enabled;
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const { categorizedAssets, stablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const filteredStablecoins = useMemo(
    () =>
      categorizedAssets.stablecoins
        .filter(
          ({ currency }) =>
            currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
        )
        .map(toAsset),
    [categorizedAssets.stablecoins, blacklistedTokenIdsSet],
  );

  // Pad with placeholder stablecoins from the DADA API when the user owns fewer
  // than EMPTY_STATE_MAX_STABLECOINS, matching the desktop behaviour.
  const needsPadding =
    isEmptyState || isReadOnly || filteredStablecoins.length < EMPTY_STATE_MAX_STABLECOINS;
  const { stablecoins: defaultStablecoins } = useDefaultAssetsByCategory(
    needsPadding,
    stablecoinTickers,
    0,
    EMPTY_STATE_MAX_STABLECOINS,
  );

  const assets = useMemo<Asset[]>(() => {
    if (isEmptyState || isReadOnly) return defaultStablecoins;

    if (filteredStablecoins.length < EMPTY_STATE_MAX_STABLECOINS) {
      const ownedIds = new Set(filteredStablecoins.map(a => a.currency.id));
      const padding = defaultStablecoins
        .filter(p => !ownedIds.has(p.currency.id))
        .slice(0, EMPTY_STATE_MAX_STABLECOINS - filteredStablecoins.length);
      return [...filteredStablecoins, ...padding];
    }

    return filteredStablecoins;
  }, [isEmptyState, isReadOnly, defaultStablecoins, filteredStablecoins]);

  const assetsCount = assets.length;

  const maxToDisplay =
    isEmptyState || isReadOnly ? EMPTY_STATE_MAX_STABLECOINS : MAX_STABLECOINS_TO_DISPLAY;

  const assetsToDisplay = useMemo(() => assets.slice(0, maxToDisplay), [assets, maxToDisplay]);

  const onPressShowAll = useCallback(() => {
    track("button_clicked", {
      button: "account_cta",
      type: "view",
      page: "Wallet",
    });
    if (!isReadOnly && isAccountListUIEnabled) {
      navigation.navigate(NavigatorName.Assets, {
        screen: ScreenName.AssetsList,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          showHeader: true,
          isSyncEnabled: true,
        },
      });
    } else {
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    }
  }, [navigation, isAccountListUIEnabled, isReadOnly]);

  const onItemPress = useCallback(
    (asset: Asset) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: "Wallet",
      });
      if (asset.isPlaceholder) {
        navigation.navigate(ScreenName.MarketDetail, {
          currencyId: asset.marketId ?? asset.currency.id,
        });
      } else {
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.Asset,
          params: {
            currency: asset.currency,
          },
        });
      }
    },
    [navigation],
  );

  const hasMore = useMemo(() => {
    if (isEmptyState || isReadOnly) return false;
    return filteredStablecoins.length > MAX_STABLECOINS_TO_DISPLAY;
  }, [isEmptyState, isReadOnly, filteredStablecoins.length]);

  return {
    assetsCount,
    hasMore,
    assetsToDisplay,
    onPressShowAll,
    onItemPress,
  };
};

export default usePortfolioStablecoinsSectionViewModel;
