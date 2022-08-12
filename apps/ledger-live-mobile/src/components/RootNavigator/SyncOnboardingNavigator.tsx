import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { ScreenName } from "../../const";
import { SyncOnboarding } from "../../screens/SyncOnboarding";
import { DeviceModelSelection } from "../../screens/SyncOnboarding/DeviceModelSelection";
import CompletionScreen from "../../screens/SyncOnboarding/CompletionScreen";

export type SyncOnboardingStackParamList = {
  // With USB transport pairedDevice is null
  SyncOnboardingCompanion: { device: Device };
  DeviceModelSelection: undefined;
  SyncOnboardingCompletion: undefined;
};

const Stack = createStackNavigator<SyncOnboardingStackParamList>();

export const SyncOnboardingNavigator = () => {

  const { colors } = useTheme();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors), [
    colors,
  ]);

  return (
  <Stack.Navigator
    screenOptions={{
      ...stackNavigatorConfig,
      headerShown: false,
    }}
  >
    <Stack.Screen
      name={ScreenName.DeviceModelSelection as "DeviceModelSelection"}
      component={DeviceModelSelection}
    />

    <Stack.Screen
      name={ScreenName.SyncOnboardingCompanion as "SyncOnboardingCompanion"}
      component={SyncOnboarding}
    />
    <Stack.Screen
      name={ScreenName.SyncOnboardingCompletion as "SyncOnboardingCompletion"}
      component={CompletionScreen}
    />
  </Stack.Navigator>
  );
  }
