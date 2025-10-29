import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { AccountSettingsNavigatorParamList } from "./types/AccountSettingsNavigator";
import { register } from "react-native-bundle-splitter";

const AccountSettingsMain = register({ loader: () => import("~/screens/AccountSettings") });
const EditAccountName = register({
  loader: () => import("~/screens/AccountSettings/EditAccountName"),
});
const AdvancedLogs = register({ loader: () => import("~/screens/AccountSettings/AdvancedLogs") });
const AccountOrder = register({ loader: () => import("~/screens/Accounts/AccountOrder") });
const AddAccount = register({ loader: () => import("~/screens/Accounts/AddAccount") });
const CurrencySettings = register({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings"),
});
const EditCurrencyUnits = register({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits"),
});
const Accounts = register({ loader: () => import("~/screens/Accounts") });

const Stack = createStackNavigator<AccountSettingsNavigatorParamList>();

export default function AccountSettingsNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.AccountSettingsMain}
        component={AccountSettingsMain}
        options={{
          title: t("account.settings.header"),
          headerRight: () => null,
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
      <Stack.Screen name={ScreenName.CurrencySettings} component={CurrencySettings} />
      <Stack.Screen name={ScreenName.EditCurrencyUnits} component={EditCurrencyUnits} />
      <Stack.Screen
        name={ScreenName.Accounts}
        component={Accounts}
        options={{
          title: t("accounts.title"),
          headerLeft: () => <AccountOrder />,
          headerRight: () => <AddAccount />,
        }}
      />
    </Stack.Navigator>
  );
}
