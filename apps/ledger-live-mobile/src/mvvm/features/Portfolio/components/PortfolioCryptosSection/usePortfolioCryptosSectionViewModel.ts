import { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useSelector } from "~/context/hooks";
import { useDistribution } from "~/actions/general";
import { NavigatorName, ScreenName } from "~/const";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import { useDefaultAssets } from "./useDefaultAssets";
import { useReadOnlyCoins } from "~/hooks/useReadOnlyCoins";

export const MAX_ASSETS_TO_DISPLAY = 6;
export const EMPTY_STATE_MAX_ASSETS = 4;
export const READ_ONLY_MAX_ASSETS = 5;

export interface PortfolioCryptosSectionViewModelResult {
  assetsCount: number;
  hasMore: boolean;
  assetsToDisplay: Asset[];
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

interface UsePortfolioCryptosSectionViewModelOptions {
  isEmptyState?: boolean;
  isReadOnly?: boolean;
}

const usePortfolioCryptosSectionViewModel = ({
  isEmptyState = false,
  isReadOnly = false,
}: UsePortfolioCryptosSectionViewModelOptions = {}): PortfolioCryptosSectionViewModelResult => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const isAccountListUIEnabled = useFeature("llmAccountListUI")?.enabled;
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });

  const distributionAssets = useMemo(
    () => (distribution.isAvailable && distribution.list.length > 0 ? distribution.list : []),
    [distribution],
  );

  const filteredAssets = useMemo(
    () =>
      distributionAssets.filter(
        ({ currency }) =>
          currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
      ),
    [distributionAssets, blacklistedTokenIdsSet],
  );

  const defaultAssets = useDefaultAssets(isEmptyState);

  const { sortedCryptoCurrencies } = useReadOnlyCoins({ maxDisplayed: READ_ONLY_MAX_ASSETS });
  const readOnlyAssets = useMemo<Asset[]>(
    () => sortedCryptoCurrencies.map(currency => ({ amount: 0, accounts: [], currency })),
    [sortedCryptoCurrencies],
  );

  const assets = useMemo<Asset[]>(() => {
    if (isEmptyState) return defaultAssets;
    if (isReadOnly) return readOnlyAssets;
    return filteredAssets;
  }, [isEmptyState, isReadOnly, defaultAssets, readOnlyAssets, filteredAssets]);

  const assetsCount = assets.length;

  const assetsToDisplay = useMemo(
    () => assets.slice(0, isEmptyState ? EMPTY_STATE_MAX_ASSETS : MAX_ASSETS_TO_DISPLAY),
    [assets, isEmptyState],
  );

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
    if (isEmptyState) return false;
    if (isReadOnly) return true;
    return assetsCount > MAX_ASSETS_TO_DISPLAY;
  }, [isEmptyState, isReadOnly, assetsCount]);

  return {
    assetsCount,
    hasMore,
    assetsToDisplay,
    onPressShowAll,
    onItemPress,
  };
};

export default usePortfolioCryptosSectionViewModel;
