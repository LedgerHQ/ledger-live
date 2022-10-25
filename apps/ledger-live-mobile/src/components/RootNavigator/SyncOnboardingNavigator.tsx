import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";

import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { ScreenName } from "../../const";
import { SyncOnboarding } from "../../screens/SyncOnboarding/index";
import CompletionScreen from "../../screens/SyncOnboarding/CompletionScreen";
import {
  SyncOnboardingCompanionParams,
  SyncOnboardingCompletionScreenParams,
} from "../../screens/SyncOnboarding/types";

export type SyncOnboardingStackParamList = {
  SyncOnboardingCompanion: SyncOnboardingCompanionParams;
  SyncOnboardingCompletion: SyncOnboardingCompletionScreenParams;
};

const Stack = createStackNavigator<SyncOnboardingStackParamList>();

export const SyncOnboardingNavigator = () => {
  const { colors } = useTheme();
  const stackNavigatorConfig = useMemo(
    () => getStackNavigatorConfig(colors),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        headerShown: false,
      }}
    >
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
};
