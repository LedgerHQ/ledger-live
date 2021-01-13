// @flow
import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import ExchangeSelectCurrency from "../../screens/Exchange/SelectCurrency";
import ExchangeSelectAccount from "../../screens/Exchange/SelectAccount";
import ExchangeConnectDevice from "../../screens/Exchange/ConnectDevice";
import ExchangeCoinifyWidget from "../../screens/Exchange/CoinifyWidgetScreen";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import AddAccountsHeaderRightClose from "../../screens/AddAccounts/AddAccountsHeaderRightClose";

export default function ExchangeNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      headerMode="float"
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
        options={{ title: t("exchange.buy.selectAccount") }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeConnectDevice}
        component={ExchangeConnectDevice}
        options={{ title: t("exchange.buy.connectDevice") }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeCoinifyWidget}
        component={ExchangeCoinifyWidget}
        options={{
          headerTitle: () => null,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
