import { Linking } from "react-native";
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { BuyDeviceNavigatorParamList } from "~/components/RootNavigator/types/BuyDeviceNavigator";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName, NavigatorName } from "~/const";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";

type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<BuyDeviceNavigatorParamList, ScreenName.GetDevice>
  | StackNavigatorNavigation<OnboardingNavigatorParamList, ScreenName.GetDevice>
>;

function useBuyDeviceAction() {
  const navigation = useNavigation<NavigationProp>();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const defaultURL = useLocalizedUrl(urls.reborn);

  const handleBuyDeviceAction = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      navigation.navigate(NavigatorName.BuyDevice, {
        screen: ScreenName.PurchaseDevice,
      });
    } else {
      Linking.openURL(defaultURL);
    }
  }, [buyDeviceFromLive?.enabled, defaultURL, navigation]);

  return handleBuyDeviceAction;
}

export default useBuyDeviceAction;
