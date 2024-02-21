import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ScreenName } from "~/const";
import MarketList from "LLM/features/Market/screens/MarketList";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { MarketNavigatorStackParamList } from "./Navigator";

const Stack = createStackNavigator<MarketNavigatorStackParamList>();

export default function MarketWalletTabNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const ptxEarnFF = useFeature("ptxEarn");
  const headerConfig = ptxEarnFF?.enabled
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
