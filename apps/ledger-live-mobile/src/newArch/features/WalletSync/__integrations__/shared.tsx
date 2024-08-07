import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorName, ScreenName } from "~/const";
import GeneralSettings from "~/screens/Settings/General";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import WalletSyncNavigator from "../WalletSyncNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const Stack = createStackNavigator<
  BaseNavigatorStackParamList & SettingsNavigatorStackParamList & WalletSyncNavigatorStackParamList
>();

export function WalletSyncSettingsNavigator() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Stack.Navigator initialRouteName={ScreenName.GeneralSettings}>
        <Stack.Screen name={ScreenName.GeneralSettings} component={GeneralSettings} />
        <Stack.Screen
          name={NavigatorName.WalletSync}
          component={WalletSyncNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </QueryClientProvider>
  );
}

export function WalletSyncSharedNavigator() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Stack.Navigator initialRouteName={ScreenName.WalletSyncActivationInit}>
        <Stack.Screen
          name={NavigatorName.WalletSync}
          component={WalletSyncNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </QueryClientProvider>
  );
}
