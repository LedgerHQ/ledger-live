import React from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import Web3HubMain from "./screens/Web3HubMain";
import { Web3HubTabStackParamList } from "./types";

const Stack = createNativeStackNavigator<Web3HubTabStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
};

export default function TabNavigator() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.Web3HubMain} screenOptions={screenOptions}>
      <Stack.Screen name={ScreenName.Web3HubMain} component={Web3HubMain} />
    </Stack.Navigator>
  );
}
