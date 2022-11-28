import { createStackNavigator } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import AddAccountsHeaderRightClose from "../../screens/AddAccounts/AddAccountsHeaderRightClose";
import ExchangeSelectAccount from "../../screens/Exchange/SelectAccount";
import ExchangeSelectCurrency from "../../screens/Exchange/SelectCurrency";
import { ExchangeStackNavigatorParamList } from "./types/ExchangeStackNavigator";

export default function ExchangeStackNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        headerRight: () => <AddAccountsHeaderRightClose />,
      }}
    >
      <Stack.Screen
        name={ScreenName.ExchangeSelectCurrency}
        component={ExchangeSelectCurrency}
        options={{ title: t("exchange.buy.selectCurrency") }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeSelectAccount}
        component={ExchangeSelectAccount}
        initialParams={{ analyticsPropertyFlow: "buy" }}
        options={{ title: t("exchange.buy.selectAccount") }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<ExchangeStackNavigatorParamList>();
