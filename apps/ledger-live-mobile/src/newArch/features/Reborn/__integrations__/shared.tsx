import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import UpsellFlex from "../screens/UpsellFlex";
import { OnboardingContextProvider } from "~/screens/Onboarding/onboardingContext";

const Stack = createStackNavigator();

export const MockComponent = () => (
  <OnboardingContextProvider>
    <Stack.Navigator>
      <Stack.Screen name="UpsellFlex" component={UpsellFlex} />
    </Stack.Navigator>
  </OnboardingContextProvider>
);
