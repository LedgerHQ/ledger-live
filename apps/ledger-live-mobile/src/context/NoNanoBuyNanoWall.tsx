import { useSelector } from "react-redux";
import { StackNavigationOptions } from "@react-navigation/stack";
import BuyDeviceNavigator from "~/components/RootNavigator/BuyDeviceNavigator";
import {
  hasCompletedOnboardingSelector,
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "~/reducers/settings";
import PostBuyDeviceSetupNanoWallScreen from "~/screens/PostBuyDeviceSetupNanoWallScreen";

/**
 * Get options to spread in a Stack.Screen you want to have a wall preventing
 * to access it when you are in a read only mode or "ordered a nano" mode.
 */
export const useNoNanoBuyNanoWallScreenOptions = ():
  | {
      component: () => JSX.Element;
      options: StackNavigationOptions;
    }
  | object => {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  if (!hasCompletedOnboarding || !readOnlyModeEnabled) return {};
  if (hasOrderedNano) {
    return {
      component: PostBuyDeviceSetupNanoWallScreen,
      options: {
        headerShown: false,
        presentation: "transparentModal",
        cardStyle: { opacity: 1 },
        gestureEnabled: true,
        headerTitle: () => null,
        headerRight: () => null,
        headerBackTitleVisible: false,
        title: undefined,
      },
    };
  }
  return {
    component: BuyDeviceNavigator,
    options: {
      headerShown: false,
      presentation: "modal",
    },
  };
};
