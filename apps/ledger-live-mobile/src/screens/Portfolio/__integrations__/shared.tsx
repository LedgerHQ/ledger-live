import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NavigatorName, ScreenName } from "~/const";
import { MockedAccounts } from "./mockedAccount";
import { State } from "~/reducers/types";
import AccountsNavigator from "LLM/features/Accounts/Navigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import AssetsNavigator from "LLM/features/Assets/Navigator";

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

const TestNavigator = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <Stack.Navigator initialRouteName={ScreenName.MockedWalletScreen}>
      <Stack.Screen name={ScreenName.MockedWalletScreen}>{() => children}</Stack.Screen>
      <Stack.Screen
        name={NavigatorName.Assets}
        component={AssetsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Accounts}
        component={AccountsNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </QueryClientProvider>
);

export const SlicedMockedAccounts = {
  ...MockedAccounts,
  active: MockedAccounts.active.slice(0, 3),
};

export const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: MockedAccounts,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
      overriddenFeatureFlags: {
        llmAccountListUI: {
          enabled: true,
        },
      },
    },
  }),
};

export default TestNavigator;
