import React from "react";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSharedValue } from "react-native-reanimated";
import { ScreenName } from "~/const";
import { HeaderContext } from "./HeaderContext";
import Web3HubMain from "./screens/Web3HubMain";
import Web3HubMainHeader from "./screens/Web3HubMain/components/Header";
import { MainProps, Web3HubTabStackParamList } from "./types";

const Stack = createNativeStackNavigator<Web3HubTabStackParamList>();

export default function TabNavigator() {
  const { t } = useTranslation();
  const layoutY = useSharedValue(0);

  return (
    <HeaderContext.Provider
      value={{
        layoutY,
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
              <Web3HubMainHeader
                title={props.options.title}
                // Using as here because we cannot use generics on the header props
                navigation={props.navigation as MainProps["navigation"]}
              />
            ),
            animation: "none",
          }}
        />
      </Stack.Navigator>
    </HeaderContext.Provider>
  );
}
