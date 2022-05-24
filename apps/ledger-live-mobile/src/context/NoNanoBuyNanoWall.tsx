import React, {
  useMemo,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import {
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "../reducers/settings";
import BuyDeviceScreen from "../screens/BuyDeviceScreen";
import { useTranslation } from "react-i18next";
import PostBuyDeviceSetupNanoWallScreen from "../screens/PostBuyDeviceSetupNanoWallScreen";
import { TransitionPresets } from "@react-navigation/stack";

/**
 * Wrap a function in this hook to decide whether or not currency values
 * should be hidden when discreet mode is enabled.
 */
export const useNoNanoBuyNanoWallScreenOptions = () => {
  const { t } = useTranslation();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  console.log("wrapper1", readOnlyModeEnabled, hasOrderedNano);

  if (true) {
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
