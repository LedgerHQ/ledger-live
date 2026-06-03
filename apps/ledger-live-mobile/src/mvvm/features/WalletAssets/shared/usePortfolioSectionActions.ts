import { useCallback } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { useAnalytics } from "~/analytics";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";

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
  const { track } = useAnalytics();
  const { openFromAsset } = useAssetDetailNavigation();

  const onPressShowAll = useCallback(() => {
    track("button_clicked", {
      button: "asset_list",
      type: variant === "stablecoin" ? "stable" : "crypto",
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
  }, [navigation, shouldDisplayAssetSection, isReadOnly, variant, track]);

  const onItemPress = useCallback(
    (asset: Asset) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: "Wallet",
      });
      openFromAsset({
        currency: asset.currency,
        source: "portfolio",
        isPlaceholder: asset.isPlaceholder,
        marketId: asset.marketId,
      });
    },
    [openFromAsset, track],
  );

  return { onPressShowAll, onItemPress };
}
