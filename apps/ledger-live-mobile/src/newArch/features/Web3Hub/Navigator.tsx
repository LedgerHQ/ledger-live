import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSharedValue } from "react-native-reanimated";
import { ScreenName } from "~/const";
import { HeaderContext } from "./HeaderContext";
import Web3HubMain from "./screens/Web3HubMain";
import Web3HubMainHeader from "./screens/Web3HubMain/components/Header";
import Web3HubSearch from "./screens/Web3HubSearch";
import Web3HubSearchHeader from "./screens/Web3HubSearch/components/Header";
import Web3HubTabs from "./screens/Web3HubTabs";
import Web3HubTabsHeader from "./screens/Web3HubTabs/components/Header";
import Web3HubApp from "./screens/Web3HubApp";
import Web3HubAppHeader from "./screens/Web3HubApp/components/Header";

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
  const { t } = useTranslation();
  const layoutY = useSharedValue(0);
  const [search, setSearch] = useState("");

  return (
    <HeaderContext.Provider
      value={{
        layoutY,
        search,
      }}
    >
      <Stack.Navigator initialRouteName={ScreenName.Web3HubMain}>
        <Stack.Screen
          name={ScreenName.Web3HubMain}
          component={Web3HubMain}
          options={{
            title: t("web3hub.main.header.title"),
            // Never just pass a component to header like `header: Web3HubMainHeader,`
            // as it would break the fast-refresh for the header
            header: props => (
              <Web3HubMainHeader title={props.options.title} navigation={props.navigation} />
            ),
            animation: "none",
          }}
        />
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
