import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import Accounts from "~/screens/Accounts";
import AccountSettingsMain from "~/screens/AccountSettings";
import EditAccountUnits from "~/screens/AccountSettings/EditAccountUnits";
import EditAccountName from "~/screens/AccountSettings/EditAccountName";
import AdvancedLogs from "~/screens/AccountSettings/AdvancedLogs";
import AccountOrder from "~/screens/Accounts/AccountOrder";
import AddAccount from "~/screens/Accounts/AddAccount";
import CurrencySettings from "~/screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { AccountSettingsNavigatorParamList } from "./types/AccountSettingsNavigator";

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
      <Stack.Screen name={ScreenName.CurrencySettings} component={CurrencySettings} />
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
