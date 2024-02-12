import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { NavigatorName } from "~/const";
import AccountsNavigator from "./AccountsNavigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import WalletTabNavigator from "./WalletTabNavigator";
import { PortfolioNavigatorStackParamList } from "./types/PortfolioNavigator";

const Stack = createStackNavigator<PortfolioNavigatorStackParamList>();

export default function PortfolioNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={stackNavigationConfig}
      initialRouteName={NavigatorName.WalletTab}
    >
      <Stack.Screen
        name={NavigatorName.WalletTab}
        component={WalletTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NavigatorName.PortfolioAccounts}
        component={AccountsNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
