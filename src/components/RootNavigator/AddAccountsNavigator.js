// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import AddAccountsSelectCrypto from "../../screens/AddAccounts/01-SelectCrypto";
import AddAccountsSelectDevice from "../../screens/AddAccounts/02-SelectDevice";
import AddAccountsTokenCurrencyDisclaimer from "../../screens/AddAccounts/02-TokenCurrencyDisclaimer";
import AddAccountsAccounts from "../../screens/AddAccounts/03-Accounts";
import AddAccountsSuccess from "../../screens/AddAccounts/04-Success";
import AddAccountsHeaderRightClose from "../../screens/AddAccounts/AddAccountsHeaderRightClose";
import EditAccountName from "../../screens/AccountSettings/EditAccountName";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";

export default function AddAccountsNavigator() {
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
        name={ScreenName.AddAccountsSelectCrypto}
        component={AddAccountsSelectCrypto}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("common.cryptoAsset")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AddAccountsSelectDevice}
        component={AddAccountsSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("common.device")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.AddAccountsAccounts}
        component={AddAccountsAccounts}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("tabs.accounts")}
              subtitle={t("send.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AddAccountsSuccess}
        component={AddAccountsSuccess}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.EditAccountName}
        component={EditAccountName}
        options={{
          title: t("account.settings.accountName.title"),
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.AddAccountsTokenCurrencyDisclaimer}
        component={AddAccountsTokenCurrencyDisclaimer}
        options={{
          title: t("addAccounts.tokens.title"),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
