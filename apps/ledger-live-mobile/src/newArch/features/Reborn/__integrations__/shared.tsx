import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UpsellFlex from "../screens/UpsellFlex";
import { OnboardingContextProvider } from "~/screens/Onboarding/onboardingContext";

const Stack = createNativeStackNavigator();

export const MockComponent = () => (
  <OnboardingContextProvider>
    <Stack.Navigator>
      <Stack.Screen name="UpsellFlex" component={UpsellFlex} />
    </Stack.Navigator>
  </OnboardingContextProvider>
);
