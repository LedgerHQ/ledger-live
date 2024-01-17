import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { LlmAnalyticsOptInPromptVariants } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import AnalyticsOptInPromptMain1 from "~/screens/AnalyticsOptInPrompt/variantA/Main";
import AnalyticsOptInPromptDetails1 from "~/screens/AnalyticsOptInPrompt/variantA/Details";
import AnalyticsOptInPromptMain2 from "~/screens/AnalyticsOptInPrompt/variantB/Main";
import AnalyticsOptInPromptDetails2 from "~/screens/AnalyticsOptInPrompt/variantB/Details";
import { AnalyticsOptInPromptNavigatorParamList } from "./types/AnalyticsOptInPromptNavigator";

export default function AnalyticsOptInPromptNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const llmAnalyticsOptInPromptFeature = useFeature("llmAnalyticsOptInPrompt");

  const screensByVariant = {
    [LlmAnalyticsOptInPromptVariants.variantA]: {
      main: AnalyticsOptInPromptMain1,
      details: AnalyticsOptInPromptDetails1,
    },
    [LlmAnalyticsOptInPromptVariants.variantB]: {
      main: AnalyticsOptInPromptMain2,
      details: AnalyticsOptInPromptDetails2,
    },
  };

  const activeVariant =
    llmAnalyticsOptInPromptFeature?.params?.variant === LlmAnalyticsOptInPromptVariants.variantB
      ? LlmAnalyticsOptInPromptVariants.variantB
      : LlmAnalyticsOptInPromptVariants.variantA;

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.AnalyticsOptInPromptMain}
        component={screensByVariant[activeVariant].main}
        options={{ title: "", headerRight: undefined }}
      />
      <Stack.Screen
        name={ScreenName.AnalyticsOptInPromptDetails}
        component={screensByVariant[activeVariant].details}
        options={{ title: "", headerRight: undefined }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<AnalyticsOptInPromptNavigatorParamList>();
