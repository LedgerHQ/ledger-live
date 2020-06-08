// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import ExchangeSelectCurrency from "../../screens/Exchange/SelectCurrency";
import ExchangeSelectAccount from "../../screens/Exchange/SelectAccount";
import ExchangeConnectDevice from "../../screens/Exchange/ConnectDevice";
import ExchangeCoinifyWidget from "../../screens/Exchange/CoinifyWidgetScreen";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import AddAccountsHeaderRightClose from "../../screens/AddAccounts/AddAccountsHeaderRightClose";
import StepHeader from "../StepHeader";

export default function ExchangeNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      headerMode="float"
      screenOptions={{
        ...closableStackNavigatorConfig,
        headerRight: () => <AddAccountsHeaderRightClose />,
      }}
    >
      <Stack.Screen
        name={ScreenName.ExchangeSelectCurrency}
        component={ExchangeSelectCurrency}
        options={{
          headerTitle: () => (
            <StepHeader title={t("exchange.buy.selectCurrency")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeSelectAccount}
        component={ExchangeSelectAccount}
        options={{
          headerTitle: () => (
            <StepHeader title={t("exchange.buy.selectAccount")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeConnectDevice}
        component={ExchangeConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader title={t("exchange.buy.connectDevice")} />
          ),
        }}
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
