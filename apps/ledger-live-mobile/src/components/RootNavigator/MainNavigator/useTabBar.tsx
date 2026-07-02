import React, { useMemo } from "react";
import { Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MainTabBar } from "LLM/components/MainTabBar";
import { useKeyboardVisible } from "~/logic/keyboardVisible";
import { NavigatorName } from "~/const";
import { useSwapWallet40HeaderState } from "~/screens/Swap/LiveApp/navigationHandlers/wallet40/useSwapWallet40HeaderState";

type Params = {
  isMainNavigatorVisible: boolean;
};

export function useTabBar({
  isMainNavigatorVisible,
}: Params): (props: BottomTabBarProps) => React.JSX.Element {
  const swapWallet40HeaderState = useSwapWallet40HeaderState();
  const { isKeyboardVisible } = useKeyboardVisible();

  return useMemo(
    () =>
      ({ ...props }: BottomTabBarProps): React.ReactElement => {
        const isSwapTabFocused = props.state.routes[props.state.index]?.name === NavigatorName.Swap;
        const hideTabBarOnAndroid =
          isSwapTabFocused && isKeyboardVisible && Platform.OS === "android";
        const hideSwapWallet40TabBar =
          isSwapTabFocused && swapWallet40HeaderState.headerStyle !== "transparent";
        const hideTabBar = !isMainNavigatorVisible || hideSwapWallet40TabBar;

        return <MainTabBar {...props} hideTabBar={hideTabBar || hideTabBarOnAndroid} />;
      },
    [isMainNavigatorVisible, isKeyboardVisible, swapWallet40HeaderState.headerStyle],
  );
}
