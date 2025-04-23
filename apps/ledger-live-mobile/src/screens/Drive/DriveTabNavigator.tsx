import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import MarketList from "LLM/features/Market/screens/MarketList";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";

export type DriveNavigatorStackParamList = {
  [ScreenName.MarketList]: { top100?: boolean };
  [ScreenName.MarketCurrencySelect]: undefined;
  [ScreenName.MarketDetail]: {
    currencyId: string;
    resetSearchOnUmount?: boolean;
  };
};

const Stack = createStackNavigator<DriveNavigatorStackParamList>();

export default function DriveTabNavigator() {
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
