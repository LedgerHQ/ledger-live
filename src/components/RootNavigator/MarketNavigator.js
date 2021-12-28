// @flow

import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import MarketList from "../../screens/Market";
import MarketDetail from "../../screens/Market/MarketDetail";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.MarketList}
        component={MarketList}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.MarketDetail}
        component={MarketDetail}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
