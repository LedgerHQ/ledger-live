import { useCallback } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";

interface PortfolioSectionActions {
  onPressShowAll: () => void;
  onItemPress: (asset: Asset) => void;
}

export function usePortfolioSectionActions(
  isReadOnly: boolean,
  variant: "crypto" | "stablecoin" | "all",
): PortfolioSectionActions {
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("mobile");
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const onPressShowAll = useCallback(() => {
    track("button_clicked", {
      button: "account_cta",
      type: "view",
      page: "Wallet",
    });
    if (!isReadOnly && shouldDisplayAssetSection) {
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Crypto,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          variant,
        },
      });
    } else {
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Assets,
      });
    }
  }, [navigation, shouldDisplayAssetSection, isReadOnly, variant]);

  const onItemPress = useCallback(
    (asset: Asset) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: "Wallet",
      });
      if (asset.isPlaceholder) {
        const currencyId = dadaIdToMarketId(asset.marketId ?? asset.currency.id);
        navigation.navigate(ScreenName.MarketDetail, {
          currencyId,
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
