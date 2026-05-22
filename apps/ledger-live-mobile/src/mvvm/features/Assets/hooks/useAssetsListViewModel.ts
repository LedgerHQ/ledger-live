import { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { GestureResponderEvent } from "react-native";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useNonBlacklistedDistribution } from "~/hooks/useNonBlacklistedDistribution";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { NavigatorName, ScreenName } from "~/const";
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
  onContentChange?: (width: number, height: number) => void;
}

export type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Assets>
  | StackNavigatorNavigation<PortfolioNavigatorStackParamList>
>;

const useAssetsListViewModel = ({
  isSyncEnabled = false,
  limitNumberOfAssets,
  onContentChange,
}: Props) => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const navigation = useNavigation<NavigationProp>();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("mobile");

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
    assetsToDisplay,
    isSyncEnabled,
    limitNumberOfAssets,
    onItemPress,
    onContentChange,
  };
};

export default useAssetsListViewModel;
