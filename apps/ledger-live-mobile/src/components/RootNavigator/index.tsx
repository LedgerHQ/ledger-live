import React from "react";
import { useSelector } from "react-redux";
import Config from "react-native-config";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { RootStackParamList } from "./types/RootNavigator";
import { AnalyticsContextProvider } from "~/analytics/AnalyticsContext";
import { StartupTimeMarker } from "../../StartupTimeMarker";
import { lazyLoad } from "LLM/utils/lazyLoad";

const BaseNavigator = lazyLoad<typeof import("./BaseNavigator").default>({
  name: NavigatorName.Base,
  loader: () => import("./BaseNavigator"),
});
const BaseOnboardingNavigator = lazyLoad<typeof import("./BaseOnboardingNavigator").default>({
  name: NavigatorName.BaseOnboarding,
  loader: () => import("./BaseOnboardingNavigator"),
});

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
