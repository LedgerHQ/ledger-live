import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import PortfolioRootScreen from "./PortfolioRootScreen";
import { PortfolioNavigatorStackParamList } from "./types/PortfolioNavigator";
import { lazyScreen } from "./lazyScreen";

const Stack = createNativeStackNavigator<PortfolioNavigatorStackParamList>();

export default function PortfolioNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.Portfolio}>
      <Stack.Screen
        name={ScreenName.Portfolio}
        component={PortfolioRootScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NavigatorName.PortfolioAccounts}
        getComponent={lazyScreen(
          () => require("./AccountsNavigator") as typeof import("./AccountsNavigator"),
        )}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
