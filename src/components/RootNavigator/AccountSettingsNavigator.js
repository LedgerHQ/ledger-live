// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import AccountSettingsMain from "../../screens/AccountSettings";
import EditAccountUnits from "../../screens/AccountSettings/EditAccountUnits";
import EditAccountName from "../../screens/AccountSettings/EditAccountName";
import AdvancedLogs from "../../screens/AccountSettings/AdvancedLogs";
import CurrencySettings from "../../screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";

export default function AccountSettingsNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{ ...closableStackNavigatorConfig, headerRight: null }}
    >
      <Stack.Screen
        name={ScreenName.AccountSettingsMain}
        component={AccountSettingsMain}
        options={{
          title: t("account.settings.header"),
          headerRight: closableStackNavigatorConfig.headerRight,
        }}
      />
      <Stack.Screen
        name={ScreenName.EditAccountUnits}
        component={EditAccountUnits}
        options={{
          title: t("account.settings.accountUnits.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.EditAccountName}
        component={EditAccountName}
        options={{
          title: t("account.settings.accountName.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AdvancedLogs}
        component={AdvancedLogs}
        options={{
          title: t("account.settings.advanced.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AccountCurrencySettings}
        component={CurrencySettings}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
