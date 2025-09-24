import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { ScreenName, NavigatorName } from "~/const";
import EditDeviceName from "~/screens/EditDeviceName";
import OnboardingNavigator from "./OnboardingNavigator";
import { SyncOnboardingNavigator } from "./SyncOnboardingNavigator";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "./PasswordModifyFlowNavigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import BuyDeviceNavigator from "./BuyDeviceNavigator";
import { BaseOnboardingNavigatorParamList } from "./types/BaseOnboardingNavigator";
import WalletSyncNavigator from "LLM/features/WalletSync/WalletSyncNavigator";
import ReceiveFundsNavigator from "./ReceiveFundsNavigator";
import DeviceSelectionNavigator from "LLM/features/DeviceSelection/Navigator";
import AddAccountsV2Navigator from "LLM/features/Accounts/Navigator";
import AccountSettingsNavigator from "./AccountSettingsNavigator";

export default function BaseOnboardingNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true, undefined, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        headerShown: false,
      }}
    >
      <Stack.Screen name={NavigatorName.Onboarding} component={OnboardingNavigator} />
      <Stack.Screen name={NavigatorName.SyncOnboarding} component={SyncOnboardingNavigator} />
      <Stack.Screen
        name={NavigatorName.BuyDevice}
        component={BuyDeviceNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NavigatorName.ReceiveFunds}
        component={ReceiveFundsNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NavigatorName.AccountSettings}
        component={AccountSettingsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.AddAccounts}
        component={AddAccountsV2Navigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.DeviceSelection}
        component={DeviceSelectionNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.EditDeviceName}
        component={EditDeviceName}
        options={{
          title: t("EditDeviceName.title"),
          headerLeft: () => null,
          headerShown: true,
        }}
      />
      <Stack.Screen name={NavigatorName.PasswordAddFlow} component={PasswordAddFlowNavigator} />
      <Stack.Screen
        name={NavigatorName.PasswordModifyFlow}
        component={PasswordModifyFlowNavigator}
      />
      <Stack.Screen
        name={NavigatorName.WalletSync}
        component={WalletSyncNavigator}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
const Stack = createNativeStackNavigator<BaseOnboardingNavigatorParamList>();
