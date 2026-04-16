import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import { TopUpAmountScreen } from "./screens/TopUpAmountScreen";
import { TopUpSuccessScreen } from "./screens/TopUpSuccessScreen";
import { TopUpValidationErrorScreen } from "./screens/TopUpValidationErrorScreen";
import type { BaanxTopUpParamList } from "./types";

const Stack = createNativeStackNavigator<BaanxTopUpParamList>();

export default function BaanxTopUpNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.BaanxTopUpAmount}
        component={TopUpAmountScreen}
      />
      <Stack.Screen
        name={ScreenName.BaanxTopUpSelectDevice}
        component={SelectDevice as React.ComponentType}
      />
      <Stack.Screen
        name={ScreenName.BaanxTopUpConnectDevice}
        component={ConnectDevice as React.ComponentType}
      />
      <Stack.Screen
        name={ScreenName.BaanxTopUpValidationSuccess}
        component={TopUpSuccessScreen}
      />
      <Stack.Screen
        name={ScreenName.BaanxTopUpValidationError}
        component={TopUpValidationErrorScreen}
      />
    </Stack.Navigator>
  );
}
