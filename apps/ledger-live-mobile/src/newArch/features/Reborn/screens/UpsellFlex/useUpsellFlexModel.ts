import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "styled-components/native";
import { setOnboardingHasDevice } from "~/actions/settings";
import { track } from "~/analytics";
import { BuyDeviceNavigatorParamList } from "~/components/RootNavigator/types/BuyDeviceNavigator";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { ScreenName, NavigatorName } from "~/const";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useNavigationInterceptor } from "~/screens/Onboarding/onboardingContext";
import { urls } from "~/utils/urls";

type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<BuyDeviceNavigatorParamList, ScreenName.GetDevice>
  | StackNavigatorNavigation<OnboardingNavigatorParamList, ScreenName.GetDevice>
>;

const useUpsellFlexModel = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const dispatch = useDispatch();
  const currentNavigation = navigation.getParent()?.getParent()?.getState().routes[0].name;
  const isInOnboarding = currentNavigation === NavigatorName.BaseOnboarding;

  const handleBack = useCallback(() => {
    navigation.goBack();
    if (readOnlyModeEnabled) {
      track("button_clicked", {
        button: "close",
        page: "Upsell Flex",
      });
    }
  }, [readOnlyModeEnabled, navigation]);

  const setupDevice = useCallback(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
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
  }, [
    setShowWelcome,
    setFirstTimeOnboarding,
    isInOnboarding,
    dispatch,
    navigation,
    readOnlyModeEnabled,
  ]);

  const buyLedger = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      // FIXME: ScreenName.PurchaseDevice does not exist when coming from the Onboarding navigator
      // @ts-expect-error This seem very impossible to type because ts is right…
      navigation.navigate(ScreenName.PurchaseDevice);
    } else {
      Linking.openURL(urls.buyFlex);
    }
  }, [buyDeviceFromLive?.enabled, navigation]);

  const videoMounted = !useIsAppInBackground();

  return {
    t,
    handleBack,
    setupDevice,
    buyLedger,
    colors,
    readOnlyModeEnabled,
    videoMounted,
  };
};

export default useUpsellFlexModel;
