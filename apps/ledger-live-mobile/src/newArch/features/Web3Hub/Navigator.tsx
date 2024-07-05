import React from "react";
import { ScreenName } from "~/const";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Web3HubMain from "./screens/Web3HubMain";
import Web3HubSearch from "./screens/Web3HubSearch";
import Web3HubTabs from "./screens/Web3HubTabs";
import Web3HubApp from "./screens/Web3HubApp";
// import TextInput from "~/components/TextInput";

export type Web3HubStackParamList = {
  [ScreenName.Web3HubMain]: undefined;
  [ScreenName.Web3HubSearch]: undefined;
  [ScreenName.Web3HubTabs]: undefined;
  [ScreenName.Web3HubApp]: {
    manifestId: string;
  };
};

const Stack = createNativeStackNavigator<Web3HubStackParamList>();

export default function Web3HubNavigator() {
  return (
    <Stack.Navigator initialRouteName={ScreenName.Web3HubMain}>
      <Stack.Screen
        name={ScreenName.Web3HubMain}
        component={Web3HubMain}
        options={{
          title: "Explore web3",
          // headerLeft: () => {
          //   return (
          //     <TextInput
          //       defaultValue="Search"
          //       keyboardType="default"
          //       returnKeyType="done"
          //       value={search}
          //       onChangeText={setSearch}
          //       onSubmitEditing={text => console.log("onSubmitEditing: ", text)}
          //     />
          //   );
          // },
        }}
      />
      <Stack.Screen
        name={ScreenName.Web3HubSearch}
        component={Web3HubSearch}
        options={{
          title: "Search web3",
        }}
      />
      <Stack.Screen
        name={ScreenName.Web3HubTabs}
        component={Web3HubTabs}
        options={{
          title: "N Tabs",
        }}
      />
      <Stack.Screen
        name={ScreenName.Web3HubApp}
        component={Web3HubApp}
        options={{
          title: "Web3 app",
        }}
      />
    </Stack.Navigator>
  );
}
