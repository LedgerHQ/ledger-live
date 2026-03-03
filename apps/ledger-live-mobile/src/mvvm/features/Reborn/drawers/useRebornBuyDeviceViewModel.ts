import { useCallback } from "react";
import { useRebornBuyDeviceDrawerController } from "../hooks/useRebornBuyDeviceDrawerController";
import { useTranslation } from "~/context/Locale";
import { useNavigation } from "@react-navigation/native";
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
import useBuyDeviceAction from "../hooks/useBuyDeviceAction";
import { REBORN_BUY_DRAWER_ANALYTICS_PAGE } from "../consts/analytics";

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
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const dispatch = useDispatch();
  const isInOnboarding = getIsBaseOnboarding(navigation);
  const handleBuyAction = useBuyDeviceAction();

  const setupDevice = useCallback(() => {
    if (isInOnboarding) dispatch(setOnboardingHasDevice(true));
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });

    if (readOnlyModeEnabled) {
      track("button_clicked", {
        button: "Connect",
        page: REBORN_BUY_DRAWER_ANALYTICS_PAGE,
      });
    }
    closeDrawer();
  }, [isInOnboarding, dispatch, navigation, readOnlyModeEnabled, closeDrawer]);

  const buyLedger = useCallback(() => {
    track("button_clicked", {
      button: "buy a ledger device",
      page: REBORN_BUY_DRAWER_ANALYTICS_PAGE,
    });
    handleBuyAction();
    closeDrawer();
  }, [handleBuyAction, closeDrawer]);

  return {
    handleClose: closeDrawer,
    isOpen,
    t,
    setupDevice,
    buyLedger,
  };
}

export default useRebornBuyDeviceViewModel;
