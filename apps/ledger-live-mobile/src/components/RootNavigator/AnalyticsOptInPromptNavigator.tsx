import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import AnalyticsOptInPromptMainA from "~/screens/AnalyticsOptInPrompt/variantA/Main";
import AnalyticsOptInPromptDetailsA from "~/screens/AnalyticsOptInPrompt/variantA/Details";
import AnalyticsOptInPromptMainB from "~/screens/AnalyticsOptInPrompt/variantB/Main";
import AnalyticsOptInPromptDetailsB from "~/screens/AnalyticsOptInPrompt/variantB/Details";
import { AnalyticsOptInPromptNavigatorParamList } from "./types/AnalyticsOptInPromptNavigator";

const screensByVariant = {
  [ABTestingVariants.variantA]: {
    main: AnalyticsOptInPromptMainA,
    details: AnalyticsOptInPromptDetailsA,
  },
  [ABTestingVariants.variantB]: {
    main: AnalyticsOptInPromptMainB,
    details: AnalyticsOptInPromptDetailsB,
  },
};

export default function AnalyticsOptInPromptNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, false), [colors]);
  const llmAnalyticsOptInPromptFeature = useFeature("llmAnalyticsOptInPrompt");

  const activeVariant =
    llmAnalyticsOptInPromptFeature?.params?.variant === ABTestingVariants.variantB
      ? ABTestingVariants.variantB
      : ABTestingVariants.variantA;

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.AnalyticsOptInPromptMain}
        component={screensByVariant[activeVariant].main}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.AnalyticsOptInPromptDetails}
        component={screensByVariant[activeVariant].details}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<AnalyticsOptInPromptNavigatorParamList>();
