import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { ScreenName, NavigatorName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { BaseOnboardingNavigatorParamList } from "./types/BaseOnboardingNavigator";
import { lazyNamed, lazyScreen } from "./lazyScreen";

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
      <Stack.Screen
        name={NavigatorName.Onboarding}
        getComponent={lazyScreen(
          () => require("./OnboardingNavigator") as typeof import("./OnboardingNavigator"),
        )}
      />
      <Stack.Screen
        name={NavigatorName.SyncOnboarding}
        getComponent={lazyNamed(
          () =>
            (require("./SyncOnboardingNavigator") as typeof import("./SyncOnboardingNavigator"))
              .SyncOnboardingNavigator,
        )}
      />
      <Stack.Screen
        name={NavigatorName.BuyDevice}
        getComponent={lazyScreen(
          () => require("./BuyDeviceNavigator") as typeof import("./BuyDeviceNavigator"),
        )}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NavigatorName.ReceiveFunds}
        getComponent={lazyScreen(
          () => require("./ReceiveFundsNavigator") as typeof import("./ReceiveFundsNavigator"),
        )}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NavigatorName.AccountSettings}
        getComponent={lazyScreen(
          () =>
            require("./AccountSettingsNavigator") as typeof import("./AccountSettingsNavigator"),
        )}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.AddAccounts}
        getComponent={lazyScreen(
          () =>
            require("LLM/features/Accounts/Navigator") as typeof import("LLM/features/Accounts/Navigator"),
        )}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.DeviceSelection}
        getComponent={lazyScreen(
          () =>
            require("LLM/features/DeviceSelection/Navigator") as typeof import("LLM/features/DeviceSelection/Navigator"),
        )}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.EditDeviceName}
        getComponent={lazyScreen(
          () => require("~/screens/EditDeviceName") as typeof import("~/screens/EditDeviceName"),
        )}
        options={{
          title: t("EditDeviceName.title"),
          headerLeft: () => null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={NavigatorName.PasswordAddFlow}
        getComponent={lazyScreen(
          () =>
            require("./PasswordAddFlowNavigator") as typeof import("./PasswordAddFlowNavigator"),
        )}
      />
      <Stack.Screen
        name={NavigatorName.PasswordModifyFlow}
        getComponent={lazyScreen(
          () =>
            require("./PasswordModifyFlowNavigator") as typeof import("./PasswordModifyFlowNavigator"),
        )}
      />
      <Stack.Screen
        name={NavigatorName.WalletSync}
        getComponent={lazyScreen(
          () =>
            require("LLM/features/WalletSync/WalletSyncNavigator") as typeof import("LLM/features/WalletSync/WalletSyncNavigator"),
        )}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
const Stack = createNativeStackNavigator<BaseOnboardingNavigatorParamList>();
