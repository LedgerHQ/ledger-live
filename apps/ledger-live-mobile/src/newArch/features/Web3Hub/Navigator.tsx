import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSharedValue } from "react-native-reanimated";
import { ScreenName } from "~/const";
import { HeaderContext } from "./HeaderContext";
import Web3HubSearch from "./screens/Web3HubSearch";
import Web3HubSearchHeader from "./screens/Web3HubSearch/components/Header";
import Web3HubTabs from "./screens/Web3HubTabs";
import Web3HubTabsHeader from "./screens/Web3HubTabs/components/Header";
import Web3HubApp from "./screens/Web3HubApp";
import Web3HubAppHeader from "./screens/Web3HubApp/components/Header";
import type { AppProps, SearchProps, TabsProps, Web3HubStackParamList } from "./types";

// Uncomment to use mocks (you need to reload the app)
// process.env.MOCK_WEB3HUB = "1";

const Stack = createNativeStackNavigator<Web3HubStackParamList>();

export default function Navigator() {
  const layoutY = useSharedValue(0);
  const [search, setSearch] = useState("");

  return (
    <HeaderContext.Provider
      value={{
        layoutY,
        search,
      }}
    >
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.Web3HubSearch}
          component={Web3HubSearch}
          options={{
            header: props => (
              <Web3HubSearchHeader
                // Using as here because we cannot use generics on the header props
                navigation={props.navigation as SearchProps["navigation"]}
                onSearch={setSearch}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.Web3HubTabs}
          component={Web3HubTabs}
          options={{
            title: "N Tabs", // Temporary, will probably be changed
            header: props => (
              <Web3HubTabsHeader
                title={props.options.title}
                // Using as here because we cannot use generics on the header props
                navigation={props.navigation as TabsProps["navigation"]}
              />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.Web3HubApp}
          component={Web3HubApp}
          options={{
            header: props => (
              <Web3HubAppHeader
                // Using as here because we cannot use generics on the header props
                navigation={props.navigation as AppProps["navigation"]}
              />
            ),
          }}
        />
      </Stack.Navigator>
    </HeaderContext.Provider>
  );
}
