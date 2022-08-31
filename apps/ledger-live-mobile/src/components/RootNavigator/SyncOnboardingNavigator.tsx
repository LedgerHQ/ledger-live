import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import { ScreenName } from "../../const";
import { SyncOnboarding } from "../../screens/SyncOnboarding";
import { DeviceModelSelection } from "../../screens/SyncOnboarding/DeviceModelSelection";

// TODO: handle usb-connected device ?
export type SyncOnboardingStackParamList = {
  // With USB transport pairedDevice is null
  SyncOnboardingCompanion: { device: Device };
  DeviceModelSelection: undefined;
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
      name={ScreenName.DeviceModelSelection as "DeviceModelSelection"}
      component={DeviceModelSelection}
    />

    <Stack.Screen
      name={ScreenName.SyncOnboardingCompanion as "SyncOnboardingCompanion"}
      component={SyncOnboarding}
      initialParams={{ pairedDevice: null }}
    />
  </Stack.Navigator>
);
