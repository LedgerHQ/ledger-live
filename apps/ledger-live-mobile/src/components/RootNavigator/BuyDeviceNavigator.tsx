import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import GetFlex from "LLM/features/Reborn/screens/UpsellFlex";
import PurchaseDevice from "~/screens/PurchaseDevice";
import { BuyDeviceNavigatorParamList } from "./types/BuyDeviceNavigator";

const Stack = createNativeStackNavigator<BuyDeviceNavigatorParamList>();

const BuyDeviceNavigator = () => {
  const { colors } = useTheme();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: false }}>
      <Stack.Screen name={ScreenName.GetDevice} component={GetFlex} />
      {buyDeviceFromLive?.enabled && (
        <Stack.Screen name={ScreenName.PurchaseDevice} component={PurchaseDevice} />
      )}
    </Stack.Navigator>
  );
};

export default BuyDeviceNavigator;
