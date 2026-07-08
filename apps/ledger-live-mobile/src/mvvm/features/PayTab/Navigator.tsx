import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { PayTabScreen } from "./screens/PayTab";
import type { PayTabNavigatorParamList } from "./types";

const TabStack = createNativeStackNavigator<PayTabNavigatorParamList>();

export default function PayTabNavigator() {
  return (
    <TabStack.Navigator screenOptions={{ headerShown: false }}>
      <TabStack.Screen name={ScreenName.PayTab} component={PayTabScreen} />
    </TabStack.Navigator>
  );
}
