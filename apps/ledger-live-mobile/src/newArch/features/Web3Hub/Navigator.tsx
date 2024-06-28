import React from "react";
import { ScreenName } from "~/const";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Web3HubMain from "./screens/Web3HubMain";
import Web3HubSearch from "./screens/Web3HubSearch";
import Web3HubTabs from "./screens/Web3HubTabs";
import Web3HubApp from "./screens/Web3HubApp";

export type Web3HubStackParamList = {
  [ScreenName.Web3HubMain]: undefined;
  [ScreenName.Web3HubSearch]: undefined;
  [ScreenName.Web3HubTabs]: undefined;
  [ScreenName.Web3HubApp]: undefined;
};

const Stack = createNativeStackNavigator<Web3HubStackParamList>();

export default function Web3HubNavigator() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.Web3HubMain}>
      <Stack.Screen
        name={ScreenName.Web3HubMain}
        component={Web3HubMain}
        // options={{
        //   title: "",
        //   headerRight: () => null,
        // }}
      />
      <Stack.Screen name={ScreenName.Web3HubSearch} component={Web3HubSearch} />
      <Stack.Screen name={ScreenName.Web3HubTabs} component={Web3HubTabs} />
      <Stack.Screen name={ScreenName.Web3HubApp} component={Web3HubApp} />
    </Stack.Navigator>
  );
}
