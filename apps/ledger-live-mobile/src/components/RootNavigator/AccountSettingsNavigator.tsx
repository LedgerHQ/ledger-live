import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import AccountSettingsMain from "~/screens/AccountSettings";
import EditAccountName from "~/screens/AccountSettings/EditAccountName";
import AdvancedLogs from "~/screens/AccountSettings/AdvancedLogs";
import CurrencySettings from "~/screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { AccountSettingsNavigatorParamList } from "./types/AccountSettingsNavigator";
import EditCurrencyUnits from "~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits";

const Stack = createNativeStackNavigator<AccountSettingsNavigatorParamList>();

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
    </Stack.Navigator>
  );
}
