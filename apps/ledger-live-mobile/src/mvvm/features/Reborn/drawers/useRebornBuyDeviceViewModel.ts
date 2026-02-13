import { useCallback } from "react";
import { useRebornBuyDeviceDrawerController } from "../hooks/useRebornBuyDeviceDrawerController";
import { useTranslation } from "~/context/Locale";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { setOnboardingHasDevice } from "~/actions/settings";
import { track } from "~/analytics";
import { BuyDeviceNavigatorParamList } from "~/components/RootNavigator/types/BuyDeviceNavigator";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { ScreenName, NavigatorName } from "~/const";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";

type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<BuyDeviceNavigatorParamList, ScreenName.GetDevice>
  | StackNavigatorNavigation<OnboardingNavigatorParamList, ScreenName.GetDevice>
>;

const getIsBaseOnboarding = (navigation: NavigationProp) => {
  let parent = navigation.getParent();
  while (parent) {
    const currentNavigation = parent.getState().routes[0].name;
    const isBaseOnboarding = currentNavigation === NavigatorName.BaseOnboarding;

    if (isBaseOnboarding) return true;

    parent = parent.getParent();
  }
  return false;
};

function useRebornBuyDeviceViewModel() {
  const { isOpen, closeDrawer } = useRebornBuyDeviceDrawerController();
  const { t } = useTranslation();

  const navigation = useNavigation<NavigationProp>();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const dispatch = useDispatch();
  const isInOnboarding = getIsBaseOnboarding(navigation);

  const setupDevice = useCallback(() => {
    if (isInOnboarding) dispatch(setOnboardingHasDevice(true));
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });

    if (readOnlyModeEnabled) {
      track("message_clicked", {
        message: "I already have a device, set it up now",
        page: "Upsell Flex",
      });
    }
    closeDrawer();
  }, [isInOnboarding, dispatch, navigation, readOnlyModeEnabled, closeDrawer]);

  const buyLedger = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      navigation.navigate(NavigatorName.BuyDevice, {
        screen: ScreenName.PurchaseDevice,
      });
    } else {
      Linking.openURL(urls.buyFlex);
    }
    closeDrawer();
  }, [buyDeviceFromLive?.enabled, navigation, closeDrawer]);

  return {
    handleClose: closeDrawer,
    isOpen,
    t,
    setupDevice,
    buyLedger,
  };
}

export default useRebornBuyDeviceViewModel;
