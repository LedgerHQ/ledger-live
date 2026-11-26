import { useContext, useEffect, useState } from "react";
import {
  NavigationContext,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";
import { NavigatorName } from "~/const";

type Navigation = NavigationProp<ParamListBase>;

function isInsideMainTabs(navigation: Navigation): boolean {
  for (let current: Navigation | undefined = navigation; current; current = current.getParent()) {
    const state = current.getState();
    if (state?.type === "tab" && state.routeNames.includes(NavigatorName.Portfolio)) return true;
  }
  return false;
}

function isDriver(navigation: Navigation | undefined): boolean {
  return !!navigation && navigation.isFocused() && isInsideMainTabs(navigation);
}

/**
 * Whether the calling screen may drive the main tab bar density: it must be focused and live
 * inside the main tab navigator, so a blurred tab or a stack screen over the tabs leaves it alone.
 */
export function useIsTabBarDensityDriver(): boolean {
  const navigation = useContext(NavigationContext) as Navigation | undefined;
  const [isTabBarDriver, setIsTabBarDriver] = useState(() => isDriver(navigation));

  useEffect(() => {
    if (!navigation) return;
    const update = () => setIsTabBarDriver(isDriver(navigation));
    update();
    const unsubscribeFocus = navigation.addListener("focus", update);
    const unsubscribeBlur = navigation.addListener("blur", update);
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  return isTabBarDriver;
}
