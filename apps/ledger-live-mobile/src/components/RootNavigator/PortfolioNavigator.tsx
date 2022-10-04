import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { NavigatorName } from "../../const";
// eslint-disable-next-line import/no-cycle
import AccountsNavigator from "./AccountsNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
// eslint-disable-next-line import/no-cycle
import WalletTabNavigator from "./WalletTabNavigator";

export default function PortfolioNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={stackNavigationConfig}
      initialRouteName={NavigatorName.WalletTab}
      backBehavior={"initialRoute"}
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

const Stack = createStackNavigator();
