import React, { useMemo } from "react";
import { Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { ColorPalette } from "@ledgerhq/native-ui";
import type { EdgeInsets } from "react-native-safe-area-context";
import customTabBar from "~/components/TabBar/CustomTabBar";
import { MainTabBar } from "LLM/components/MainTabBar";
import { useKeyboardVisible } from "~/logic/keyboardVisible";
import { NavigatorName } from "~/const";
import { useSwapWallet40HeaderState } from "~/screens/Swap/LiveApp/navigationHandlers/wallet40/useSwapWallet40HeaderState";

type Params = {
  shouldDisplayWallet40MainNav: boolean;
  isMainNavigatorVisible: boolean;
  colors: ColorPalette;
  insets: EdgeInsets;
};

export function useTabBar({
  shouldDisplayWallet40MainNav,
  isMainNavigatorVisible,
  colors,
  insets,
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

        return shouldDisplayWallet40MainNav ? (
          <MainTabBar {...props} hideTabBar={hideTabBar || hideTabBarOnAndroid} />
        ) : (
          customTabBar({
            ...props,
            colors,
            insets,
            hideTabBar: !isMainNavigatorVisible,
          })
        );
      },
    [
      colors,
      insets,
      isMainNavigatorVisible,
      isKeyboardVisible,
      shouldDisplayWallet40MainNav,
      swapWallet40HeaderState.headerStyle,
    ],
  );
}
