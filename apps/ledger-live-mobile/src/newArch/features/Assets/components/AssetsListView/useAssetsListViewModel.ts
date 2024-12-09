import { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { GestureResponderEvent, useStartProfiler } from "@shopify/react-native-performance";
import { useSelector } from "react-redux";
import { useDistribution, useRefreshAccountsOrdering } from "~/actions/general";
import { NavigatorName, ScreenName } from "~/const";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { PortfolioNavigatorStackParamList } from "~/components/RootNavigator/types/PortfolioNavigator";

export interface Props {
  sourceScreenName?: ScreenName;
  isSyncEnabled?: boolean;
  limitNumberOfAssets?: number;
}

export type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Assets>
  | StackNavigatorNavigation<PortfolioNavigatorStackParamList>
>;

const useAssetsListViewModel = ({
  sourceScreenName,
  isSyncEnabled = false,
  limitNumberOfAssets,
}: Props) => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const navigation = useNavigation<NavigationProp>();
  const startNavigationTTITimer = useStartProfiler();
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const assets: Asset[] = useMemo(
    () => (distribution.isAvailable && distribution.list.length > 0 ? distribution.list : []),
    [distribution],
  );

  const assetsToDisplay = useMemo(
    () =>
      assets
        .filter(
          asset =>
            asset.currency.type !== "TokenCurrency" ||
            !blacklistedTokenIdsSet.has(asset.currency.id),
        )
        .slice(0, limitNumberOfAssets),
    [assets, blacklistedTokenIdsSet, limitNumberOfAssets],
  );

  const onItemPress = useCallback(
    (asset: Asset, uiEvent: GestureResponderEvent) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: "Assets",
      });
      startNavigationTTITimer({
        source: sourceScreenName,
        uiEvent,
      });
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: {
          currency: asset.currency,
        },
      });
    },
    [navigation, sourceScreenName, startNavigationTTITimer],
  );

  return {
    assetsToDisplay,
    isSyncEnabled,
    onItemPress,
  };
};

export default useAssetsListViewModel;
