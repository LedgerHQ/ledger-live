/* eslint-disable import/no-unresolved */
// @flow

import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
// $FlowFixMe
import MarketList from "../../screens/Market";
// $FlowFixMe
import MarketDetail from "../../screens/Market/MarketDetail";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={stackNavigationConfig}
      initialRouteName={ScreenName.MarketList}
      backBehavior={"initialRoute"}
    >
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
