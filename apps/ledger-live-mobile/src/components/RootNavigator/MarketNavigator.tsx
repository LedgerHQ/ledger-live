import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import MarketList from "~/screens/Market";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { MarketNavigatorStackParamList } from "./types/MarketNavigator";

export default function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Stack.Screen
        name={ScreenName.MarketList}
        component={MarketList}
        options={{
          headerShown: true,
          title: "",
          headerRight: undefined,
          headerLeft: () => null,
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
}
const Stack = createStackNavigator<MarketNavigatorStackParamList>();
