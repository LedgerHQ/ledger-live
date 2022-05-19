import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { ScreenName } from "../../const";
import { SyncOnboarding } from "../../screens/SyncOnboarding";

// TODO - https://reactnavigation.org/docs/typescript/
// With route type, do we still need https://github.com/LedgerHQ/ledger-live-mobile/blob/develop/src/const/navigation.js
// ? Need to cast each name to be able to use the const and the navigator typing
export type SyncOnboardingStackParamList = {
  SyncOnboardingWelcome: { pairedDevice: Device | null };
};

const Stack = createStackNavigator<SyncOnboardingStackParamList>();

export const SyncOnboardingNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      headerTitle: "",
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen
      name={ScreenName.SyncOnboardingWelcome as "SyncOnboardingWelcome"}
      component={SyncOnboarding}
      initialParams={{ pairedDevice: null }}
    />
  </Stack.Navigator>
);
