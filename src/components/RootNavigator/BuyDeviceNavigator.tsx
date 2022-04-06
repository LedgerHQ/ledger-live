import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";

import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import BuyDevice from "../../screens/BuyDeviceScreen";
import PurchaseDevice from "../../screens/PurchaseDevice";

const Stack = createStackNavigator();

const BuyDeviceNavigator = () => {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{ ...stackNavigationConfig, headerShown: false }}
    >
      <Stack.Screen name={ScreenName.BuyDevice} component={BuyDevice} />
      <Stack.Screen
        name={ScreenName.PurchaseDevice}
        component={PurchaseDevice}
      />
    </Stack.Navigator>
  );
};

export default BuyDeviceNavigator;
