import { useSelector } from "~/context/hooks";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import {
  hasCompletedOnboardingSelector,
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "~/reducers/settings";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

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
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("mobile");
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const shouldUseLegacyRebornFlow = readOnlyModeEnabled && !shouldUseLazyOnboarding;

  if (!hasCompletedOnboarding || !readOnlyModeEnabled) return {};

  if (!shouldUseLegacyRebornFlow) return {};

  if (!hasOrderedNano) {
    return {
      component: require("~/components/RootNavigator/BuyDeviceNavigator").default,
      options: {
        headerShown: false,
        presentation: "transparentModal",
        animation: "slide_from_bottom",
      },
    };
  }

  return {
    component: require("~/screens/PostBuyDeviceSetupNanoWallScreen").default,
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
};
