import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorName, ScreenName } from "~/const";
import GeneralSettings from "~/screens/Settings/General";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { getSdk } from "@ledgerhq/trustchain/index";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import WalletSyncNavigator from "../WalletSyncNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { State } from "~/reducers/types";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { EMPTY } from "rxjs";

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

export const simpleTrustChain = {
  rootId: "rootId",
  deviceId: "deviceId",
  applicationPath: "applicationPath",
  trustchainId: "trustchainId",
  walletSyncEncryptionKey: "walletSyncEncryptionKey",
};

export const INITIAL_TEST = (state: State) => ({
  ...state,
  settings: {
    ...state.settings,
    readOnlyModeEnabled: false,
    overriddenFeatureFlags: {
      llmWalletSync: {
        enabled: true,
        params: {
          environment: "STAGING",
          watchConfig: {},
          learnMoreLink: "https://www.ledger.com",
        },
      },
    },
  },
});

export const mockedSdk = getSdk(
  true,
  {
    applicationId: 12,
    name: "LLD Integration",
    apiBaseUrl: getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl,
  },
  () => () => EMPTY,
);
