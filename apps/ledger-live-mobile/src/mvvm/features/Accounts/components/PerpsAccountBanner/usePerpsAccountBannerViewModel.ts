import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { useFeature } from "@features/platform-feature-flags";

export function usePerpsAccountBannerViewModel(currency: CryptoCurrency) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const perpsLiveApp = useFeature("ptxPerpsLiveAppMobile");

  const onOpenPerps = useCallback(() => {
    track("button_clicked", {
      button: "open_perps",
      banner: "perps account",
      page: ScreenName.Account,
    });
    navigation.navigate(NavigatorName.Perps, { screen: ScreenName.PerpsTab });
  }, [navigation]);

  return {
    isVisible: currency.family === "hypercore" && Boolean(perpsLiveApp?.enabled),
    onOpenPerps,
  };
}
