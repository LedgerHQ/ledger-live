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

// Uncomment to use mocks
// process.env.MOCK_WEB3HUB = "1";

export type Web3HubStackParamList = {
  [ScreenName.Web3HubSearch]: undefined;
  [ScreenName.Web3HubTabs]: undefined;
  [ScreenName.Web3HubApp]: {
    manifestId: string;
    queryParams?: Record<string, string | undefined>;
  };
};

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
              <Web3HubSearchHeader navigation={props.navigation} onSearch={setSearch} />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.Web3HubTabs}
          component={Web3HubTabs}
          options={{
            title: "N Tabs", // Temporary, will probably be changed
            header: props => (
              <Web3HubTabsHeader title={props.options.title} navigation={props.navigation} />
            ),
          }}
        />
        <Stack.Screen
          name={ScreenName.Web3HubApp}
          component={Web3HubApp}
          options={{
            header: props => <Web3HubAppHeader navigation={props.navigation} />,
          }}
        />
      </Stack.Navigator>
    </HeaderContext.Provider>
  );
}
