import React from "react";
import { useSelector } from "react-redux";
import {
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "../reducers/settings";
import BuyDeviceScreen from "../screens/BuyDeviceScreen";
import PostBuyDeviceSetupNanoWallScreen from "../screens/PostBuyDeviceSetupNanoWallScreen";

/**
 * Get options to spread in a Stack.Screen you want to have a wall preventing
 * to access it when you are in a read only mode or "ordered a nano" mode.
 */
export const useNoNanoBuyNanoWallScreenOptions = () => {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  if (hasOrderedNano) {
    return {
      component: PostBuyDeviceSetupNanoWallScreen,
      options: {
        headerShown: false,
        presentation: "transparentModal",
        headerMode: "none",
        mode: "modal",
        transparentCard: true,
        cardStyle: { opacity: 1 },
        gestureEnabled: true,
      },
    };
  }
  if (readOnlyModeEnabled) {
    return {
      component: BuyDeviceScreen,
      options: {
        headerShown: false,
      },
    };
  }

  return {};
};
