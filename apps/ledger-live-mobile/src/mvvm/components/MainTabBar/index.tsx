import React, { useMemo } from "react";
import { Platform } from "react-native";
import { rgba } from "@ledgerhq/native-ui/styles/helpers";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardVisible } from "~/logic/keyboardVisible";
import { useMainTabBarViewModel } from "./useMainTabBarViewModel";
import { MainTabBarView } from "./MainTabBarView";
import type { MainTabBarProps, MainTabBarViewProps } from "./types";

export function MainTabBar({
  state,
  navigation,
  hideTabBar = false,
}: MainTabBarProps): React.JSX.Element {
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { keyboardHeight } = useKeyboardVisible();
  const viewModel = useMainTabBarViewModel({ state, navigation });

  const bgBase = theme.colors.bg.base;

  const gradientColors = useMemo<MainTabBarViewProps["gradientColors"]>(
    () => [rgba(bgBase, 0), rgba(bgBase, 0.7), rgba(bgBase, 0.8)],
    [bgBase],
  );

  // On Android 35+ the keyboard overlaps the tab bar because it is absolutely
  // positioned. Shift the whole bar upward by the keyboard height so it stays
  // visible, matching the behaviour of the legacy CustomTabBar.
  const bottomOffset = Platform.OS === "android" && Platform.Version >= 35 ? keyboardHeight : 0;

  return (
    <MainTabBarView
      {...viewModel}
      hideTabBar={hideTabBar}
      bottomInset={bottom}
      bottomOffset={bottomOffset}
      gradientColors={gradientColors}
    />
  );
}
