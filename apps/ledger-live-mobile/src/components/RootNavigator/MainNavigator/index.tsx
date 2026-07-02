import React from "react";
import { useTheme } from "styled-components/native";
import { useSelector } from "~/context/hooks";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import { useTabBar } from "./useTabBar";
import { useScreenOptions } from "./useScreenOptions";
import { Wallet40TabNavigator } from "./Wallet40TabNavigator";

export default function MainNavigator() {
  const { colors } = useTheme();
  const isMainNavigatorVisible = useSelector(isMainNavigatorVisibleSelector);

  const tabBar = useTabBar({
    isMainNavigatorVisible,
  });

  const screenOptions = useScreenOptions({
    colors,
  });

  return <Wallet40TabNavigator tabBar={tabBar} screenOptions={screenOptions} />;
}
