import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WalletSyncNavigator from "LLM/features/WalletSync/WalletSyncNavigator";
import { NavigatorName, ScreenName } from "~/const";
import FirmwareUpdateScreen from "~/screens/FirmwareUpdate";
import { DeviceOnboardingProvider } from "../hooks/DeviceOnboardingProvider";
import { DeviceOnboardingConnect } from "../screens/Connect";
import { DeviceOnboardingFunnel } from "../screens/Funnel";
import { SyncOfferRoute } from "../screens/SyncOffer/SyncOfferRoute";
import type { DeviceOnboardingNavigatorParamList } from "./types";

const Stack = createNativeStackNavigator<DeviceOnboardingNavigatorParamList>();

function FirmwareUpdateHeaderLeft() {
  return null;
}

/** The device flow: one session, from pairing to the last check. Leave it with Close, not a swipe. */
export function DeviceOnboardingNavigator() {
  return (
    <DeviceOnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen
          name={ScreenName.DeviceOnboardingConnect}
          component={DeviceOnboardingConnect}
        />
        <Stack.Screen
          name={ScreenName.DeviceOnboardingFunnel}
          component={DeviceOnboardingFunnel}
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name={ScreenName.DeviceOnboardingSyncOffer}
          component={SyncOfferRoute}
          options={{ animation: "fade" }}
        />
        <Stack.Screen name={NavigatorName.WalletSync} component={WalletSyncNavigator} />
        <Stack.Screen
          name={ScreenName.FirmwareUpdate}
          component={FirmwareUpdateScreen}
          options={{
            headerShown: true,
            headerTitle: () => null,
            title: "",
            headerLeft: FirmwareUpdateHeaderLeft,
            headerRight: () => null,
          }}
        />
      </Stack.Navigator>
    </DeviceOnboardingProvider>
  );
}
