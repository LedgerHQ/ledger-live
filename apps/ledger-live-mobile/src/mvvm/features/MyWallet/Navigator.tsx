import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { MyWalletScreen } from "./index";
import { MyWalletNavigatorStackParamList } from "./types";

const Stack = createNativeStackNavigator<MyWalletNavigatorStackParamList>();

export default function MyWalletNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.MyWallet} component={MyWalletScreen} />
    </Stack.Navigator>
  );
}
