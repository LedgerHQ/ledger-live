import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { BaanxLoginScreen } from "./screens/BaanxLoginScreen";
import { BaanxDashboardScreen } from "./screens/BaanxDashboardScreen";
import type { BaanxCardNavigatorParamList } from "./types";

const Stack = createNativeStackNavigator<BaanxCardNavigatorParamList>();

export default function BaanxCardNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.BaanxCardLogin} component={BaanxLoginScreen} />
      <Stack.Screen name={ScreenName.BaanxCardDashboard} component={BaanxDashboardScreen} />
    </Stack.Navigator>
  );
}
