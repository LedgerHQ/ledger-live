import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import MarketList from "LLM/features/Market/screens/MarketList/MarketListCont";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";

export type MarketNavigatorStackParamList = {
  [ScreenName.MarketList]: { top100?: boolean };
};

export default function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const headerConfig = {
    headerShown: true,
    title: "",
    headerRight: undefined,
    headerLeft: () => null,
    headerTransparent: true,
  };

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Stack.Screen name={ScreenName.MarketList} component={MarketList} options={headerConfig} />
    </Stack.Navigator>
  );
}
const Stack = createStackNavigator<MarketNavigatorStackParamList>();
