import React, { useMemo } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { ColorPalette } from "@ledgerhq/native-ui";
import type { EdgeInsets } from "react-native-safe-area-context";
import customTabBar from "~/components/TabBar/CustomTabBar";
import { MainTabBar } from "LLM/components/MainTabBar";
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

  return useMemo(
    () =>
      ({ ...props }: BottomTabBarProps): React.ReactElement => {
        const isSwapTabFocused = props.state.routes[props.state.index]?.name === NavigatorName.Swap;
        const hideSwapWallet40TabBar =
          isSwapTabFocused && swapWallet40HeaderState.headerStyle !== "transparent";
        const hideTabBar = !isMainNavigatorVisible || hideSwapWallet40TabBar;

        return shouldDisplayWallet40MainNav ? (
          <MainTabBar {...props} hideTabBar={hideTabBar} />
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
      shouldDisplayWallet40MainNav,
      swapWallet40HeaderState.headerStyle,
    ],
  );
}
