import React from "react";
import { useSelector } from "react-redux";
import Config from "react-native-config";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import BaseNavigator from "./BaseNavigator";
import BaseOnboardingNavigator from "./BaseOnboardingNavigator";
import { RootStackParamList } from "./types/RootNavigator";
import { AnalyticsContextProvider } from "~/analytics/AnalyticsContext";
import { StartupTimeMarker } from "../../StartupTimeMarker";

export default function RootNavigator() {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
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
        </Stack.Navigator>
      </AnalyticsContextProvider>
    </StartupTimeMarker>
  );
}
const Stack = createNativeStackNavigator<RootStackParamList>();
