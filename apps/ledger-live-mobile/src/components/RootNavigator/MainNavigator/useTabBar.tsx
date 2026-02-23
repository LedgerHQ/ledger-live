import React, { useMemo } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { ColorPalette } from "@ledgerhq/native-ui";
import type { EdgeInsets } from "react-native-safe-area-context";
import customTabBar from "~/components/TabBar/CustomTabBar";
import { MainTabBar } from "LLM/components/MainTabBar";

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
  return useMemo(
    () =>
      ({ ...props }: BottomTabBarProps): React.ReactElement =>
        shouldDisplayWallet40MainNav ? (
          <MainTabBar {...props} hideTabBar={!isMainNavigatorVisible} />
        ) : (
          customTabBar({
            ...props,
            colors,
            insets,
            hideTabBar: !isMainNavigatorVisible,
          })
        ),
    [colors, insets, isMainNavigatorVisible, shouldDisplayWallet40MainNav],
  );
}
