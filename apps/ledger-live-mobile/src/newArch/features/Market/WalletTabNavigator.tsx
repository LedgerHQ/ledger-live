import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import MarketList from "LLM/features/Market/screens/MarketList";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { MarketNavigatorStackParamList } from "./Navigator";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";

const Stack = createNativeStackNavigator<MarketNavigatorStackParamList>();

const options = {
  ...TransparentHeaderNavigationOptions,
  headerShown: true,
  headerRight: undefined,
  headerLeft: () => null,
} as const;

export default function MarketWalletTabNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Stack.Screen name={ScreenName.MarketList} component={MarketList} options={options} />
    </Stack.Navigator>
  );
}
