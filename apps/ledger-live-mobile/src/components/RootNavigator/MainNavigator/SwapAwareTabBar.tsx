import React from "react";
import { Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MainTabBar } from "LLM/components/MainTabBar";
import { useSwapWallet40HeaderState } from "~/screens/Swap/LiveApp/navigationHandlers/wallet40/useSwapWallet40HeaderState";

type Props = BottomTabBarProps & {
  isMainNavigatorVisible: boolean;
  isKeyboardVisible: boolean;
};

export function SwapAwareTabBar({
  isMainNavigatorVisible,
  isKeyboardVisible,
  ...props
}: Props): React.JSX.Element {
  const swapWallet40HeaderState = useSwapWallet40HeaderState();
  const hideTabBarOnAndroid = isKeyboardVisible && Platform.OS === "android";
  const hideSwapWallet40TabBar = swapWallet40HeaderState.headerStyle !== "transparent";
  const hideTabBar = !isMainNavigatorVisible || hideSwapWallet40TabBar;

  return <MainTabBar {...props} hideTabBar={hideTabBar || hideTabBarOnAndroid} />;
}
