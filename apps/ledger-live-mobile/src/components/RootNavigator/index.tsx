import React from "react";
import { useSelector } from "~/context/hooks";
import Config from "react-native-config";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import BaseNavigator from "./BaseNavigator";
import BaseOnboardingNavigator from "./BaseOnboardingNavigator";
import { DeviceOnboardingNavigator } from "LLM/features/DeviceOnboarding/navigation/DeviceOnboardingNavigator";
import { RootStackParamList } from "./types/RootNavigator";
import { AnalyticsContextProvider } from "~/analytics/AnalyticsContext";
import { StartupTimeMarker } from "../../StartupTimeMarker";
import { useSuppressQ2TourForNewUsers } from "LLM/features/Q2WalletV4Tour/hooks/useSuppressQ2TourForNewUsers";
import { useSuppressQ3TourForNewUsers } from "LLM/features/Q3WalletV4Tour/hooks/useSuppressQ3TourForNewUsers";

export default function RootNavigator() {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  useSuppressQ2TourForNewUsers();
  useSuppressQ3TourForNewUsers();
  const goToOnboarding = !hasCompletedOnboarding && !Config.SKIP_ONBOARDING;

  return (
    <StartupTimeMarker>
      <AnalyticsContextProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {goToOnboarding ? (
            <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingNavigator} />
          ) : null}
          <Stack.Screen name={NavigatorName.Base} component={BaseNavigator} />
          {hasCompletedOnboarding ? (
            <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingNavigator} />
          ) : null}
          {/* The iOS swipe on a nested screen pops this root route, so the flow turns it off here. */}
          <Stack.Screen
            name={NavigatorName.DeviceOnboarding}
            component={DeviceOnboardingNavigator}
            options={{ gestureEnabled: false }}
          />
        </Stack.Navigator>
      </AnalyticsContextProvider>
    </StartupTimeMarker>
  );
}
const Stack = createNativeStackNavigator<RootStackParamList>();
