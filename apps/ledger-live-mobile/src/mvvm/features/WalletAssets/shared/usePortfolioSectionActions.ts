import { useCallback } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";

interface PortfolioSectionActions {
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

export function usePortfolioSectionActions(isReadOnly: boolean): PortfolioSectionActions {
  const isAccountListUIEnabled = useFeature("llmAccountListUI")?.enabled;
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

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

  return { onPressShowAll, onItemPress };
}
