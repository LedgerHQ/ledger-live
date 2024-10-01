import React from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import Web3HubSearch from "./screens/Web3HubSearch";
import Web3HubTabs from "./screens/Web3HubTabs";
import Web3HubApp from "./screens/Web3HubApp";
import type { Web3HubStackParamList } from "./types";

// Uncomment to use mocks (you need to reload the app)
// process.env.MOCK_WEB3HUB = "1";

const Stack = createNativeStackNavigator<Web3HubStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  // presentation: "transparentModal",
};

export default function Navigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name={ScreenName.Web3HubSearch} component={Web3HubSearch} />
      <Stack.Screen name={ScreenName.Web3HubTabs} component={Web3HubTabs} />
      <Stack.Screen name={ScreenName.Web3HubApp} component={Web3HubApp} />
    </Stack.Navigator>
  );
}
