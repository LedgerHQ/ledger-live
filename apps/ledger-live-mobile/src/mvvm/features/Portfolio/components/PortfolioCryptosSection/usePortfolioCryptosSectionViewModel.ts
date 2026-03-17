import { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useSelector } from "~/context/hooks";
import { useDistribution } from "~/actions/general";
import { NavigatorName, ScreenName } from "~/const";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";

export const MAX_ASSETS_TO_DISPLAY = 6;

export interface PortfolioCryptosSectionViewModelResult {
  assetsCount: number;
  hasMore: boolean;
  assetsToDisplay: Asset[];
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

const usePortfolioCryptosSectionViewModel = (): PortfolioCryptosSectionViewModelResult => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });

  const allAssets = useMemo(
    () => (distribution.isAvailable && distribution.list.length > 0 ? distribution.list : []),
    [distribution],
  );

  const filteredAssets = useMemo(
    () =>
      allAssets.filter(
        ({ currency }) =>
          currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
      ),
    [allAssets, blacklistedTokenIdsSet],
  );

  const assetsCount = filteredAssets.length;

  const assetsToDisplay = useMemo(
    () => filteredAssets.slice(0, MAX_ASSETS_TO_DISPLAY),
    [filteredAssets],
  );

  const onPressShowAll = useCallback(() => {
    track("button_clicked", {
      button: "account_cta",
      type: "view",
      page: "Wallet",
    });
    navigation.navigate(NavigatorName.Assets, {
      screen: ScreenName.AssetsList,
      params: {
        sourceScreenName: ScreenName.Portfolio,
        showHeader: true,
        isSyncEnabled: true,
      },
    });
  }, [navigation]);

  const onItemPress = useCallback(
    (asset: Asset) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: "Wallet",
      });
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: {
          currency: asset.currency,
        },
      });
    },
    [navigation],
  );

  return {
    assetsCount,
    hasMore: assetsCount > MAX_ASSETS_TO_DISPLAY,
    assetsToDisplay,
    onPressShowAll,
    onItemPress,
  };
};

export default usePortfolioCryptosSectionViewModel;
