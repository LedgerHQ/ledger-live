import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { ScreenName } from "~/const";
import MarketList from "~/screens/Market";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { MarketNavigatorStackParamList } from "./types/MarketNavigator";

export default function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const ptxEarnFeature = useFeature("ptxEarn");
  const headerConfig = ptxEarnFeature?.enabled
    ? {
        headerShown: true,
        title: "",
        headerRight: undefined,
        headerLeft: () => null,
        headerTransparent: true,
      }
    : {
        headerShown: false,
        headerTransparent: true,
      };

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Stack.Screen name={ScreenName.MarketList} component={MarketList} options={headerConfig} />
    </Stack.Navigator>
  );
}
const Stack = createStackNavigator<MarketNavigatorStackParamList>();
