import { useSelector } from "~/context/hooks";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
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
      component: () => React.JSX.Element;
      options: NativeStackNavigationOptions;
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
        contentStyle: { opacity: 1 },
        gestureEnabled: true,
        headerTitle: "",
        headerRight: () => null,
        headerBackButtonDisplayMode: "minimal",
        title: undefined,
      },
    };
  }
  return {
    component: BuyDeviceNavigator,
    options: {
      headerShown: false,
      presentation: "transparentModal",
      animation: "slide_from_bottom",
    },
  };
};
