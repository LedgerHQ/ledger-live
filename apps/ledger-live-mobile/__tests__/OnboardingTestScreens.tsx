import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import PostWelcomeSelection from "~/screens/Onboarding/steps/postWelcomeSelection";
import OnboardingDeviceSelection from "~/screens/Onboarding/steps/deviceSelection";

const BaseOnboardingStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();

function OnboardingScreens() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <OnboardingStack.Screen
        name={ScreenName.OnboardingPostWelcomeSelection}
        component={PostWelcomeSelection}
      />
      <OnboardingStack.Screen
        name={ScreenName.OnboardingDeviceSelection}
        component={OnboardingDeviceSelection}
      />
    </OnboardingStack.Navigator>
  );
}

/** Real Get Started and device list, nested like the app. Mount as `NavigatorName.BaseOnboarding`. */
export function BaseOnboardingTestScreens() {
  return (
    <BaseOnboardingStack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <BaseOnboardingStack.Screen name={NavigatorName.Onboarding} component={OnboardingScreens} />
    </BaseOnboardingStack.Navigator>
  );
}
