import { useSelector } from "react-redux";
import {
  CardStyleInterpolators,
  StackNavigationOptions,
} from "@react-navigation/stack";
// eslint-disable-next-line import/no-cycle
import BuyDeviceNavigator from "../components/RootNavigator/BuyDeviceNavigator";
import {
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "../reducers/settings";
import PostBuyDeviceSetupNanoWallScreen from "../screens/PostBuyDeviceSetupNanoWallScreen";

/**
 * Get options to spread in a Stack.Screen you want to have a wall preventing
 * to access it when you are in a read only mode or "ordered a nano" mode.
 */
export function useNoNanoBuyNanoWallScreenOptions(): {
  component?: React.ComponentType<any>;
  options?: StackNavigationOptions;
} {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  if (hasOrderedNano) {
    return {
      component: PostBuyDeviceSetupNanoWallScreen,
      options: {
        headerShown: false,
        presentation: "transparentModal",
        headerMode: "screen",
        cardStyle: { opacity: 1 },
        gestureEnabled: true,
        headerTitle: () => null,
        headerRight: () => null,
        headerBackTitleVisible: false,
        title: undefined,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
      },
    };
  }
  if (readOnlyModeEnabled) {
    return {
      component: BuyDeviceNavigator,
      options: {
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
      },
    };
  }

  return {};
}
