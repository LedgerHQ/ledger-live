import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardVisible } from "~/logic/keyboardVisible";
import { useMainTabBarViewModel } from "./useMainTabBarViewModel";
import { MainTabBarView } from "./MainTabBarView";
import type { MainTabBarProps } from "./types";

export function MainTabBar({
  state,
  navigation,
  hideTabBar = false,
}: MainTabBarProps): React.JSX.Element {
  const { bottom } = useSafeAreaInsets();
  const { keyboardHeight } = useKeyboardVisible();
  const viewModel = useMainTabBarViewModel({ state, navigation });

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
    />
  );
}
