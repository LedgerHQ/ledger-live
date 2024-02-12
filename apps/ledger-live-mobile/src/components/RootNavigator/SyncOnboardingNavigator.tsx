import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";

import { ScreenName } from "~/const";
import CompletionScreen from "~/screens/SyncOnboarding/CompletionScreen";
import { SyncOnboardingStackParamList } from "./types/SyncOnboardingNavigator";
import { SyncOnboarding } from "~/screens/SyncOnboarding";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";

const Stack = createStackNavigator<SyncOnboardingStackParamList>();

export const SyncOnboardingNavigator = () => {
  const { colors } = useTheme();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        headerShown: false,
      }}
    >
      <Stack.Screen name={ScreenName.SyncOnboardingCompanion} component={SyncOnboarding} />
      <Stack.Screen name={ScreenName.SyncOnboardingCompletion} component={CompletionScreen} />
    </Stack.Navigator>
  );
};
