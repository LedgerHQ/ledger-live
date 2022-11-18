import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "../../const";
import Portfolio from "../../screens/Portfolio";
import ReadOnlyPortfolio from "../../screens/Portfolio/ReadOnly";
import AccountsNavigator from "./AccountsNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { accountsSelector } from "../../reducers/accounts";
import { PortfolioNavigatorStackParamList } from "./types/PortfolioNavigator";

const Stack = createStackNavigator<PortfolioNavigatorStackParamList>();

export default function PortfolioNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accounts = useSelector(accountsSelector);

  return (
    <Stack.Navigator
      screenOptions={stackNavigationConfig}
      initialRouteName={ScreenName.Portfolio}
    >
      <Stack.Screen
        name={ScreenName.Portfolio}
        component={
          readOnlyModeEnabled && accounts.length <= 0
            ? ReadOnlyPortfolio
            : Portfolio
        }
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
