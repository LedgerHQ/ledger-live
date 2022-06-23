import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { ScreenName } from "../../const";
import { SyncOnboarding } from "../../screens/SyncOnboarding";

// TODO: handle usb-connected device ?
export type SyncOnboardingStackParamList = {
  SyncOnboardingCompanion: { pairedDevice: Device | null };
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
      name={ScreenName.SyncOnboardingCompanion}
      component={SyncOnboarding}
      initialParams={{ pairedDevice: null }}
    />
  </Stack.Navigator>
);
