import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";

import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import GetDevice from "~/screens/GetDeviceScreen";
import PurchaseDevice from "~/screens/PurchaseDevice";
import { BuyDeviceNavigatorParamList } from "./types/BuyDeviceNavigator";

const Stack = createStackNavigator<BuyDeviceNavigatorParamList>();

const BuyDeviceNavigator = () => {
  const { colors } = useTheme();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: false }}>
      <Stack.Screen name={ScreenName.GetDevice} component={GetDevice} />
      {buyDeviceFromLive?.enabled && (
        <Stack.Screen name={ScreenName.PurchaseDevice} component={PurchaseDevice} />
      )}
    </Stack.Navigator>
  );
};

export default BuyDeviceNavigator;
