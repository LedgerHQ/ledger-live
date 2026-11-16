import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { PredictionsLiveApp } from "LLM/features/Predictions";
import { PredictionsLiveAppNavigatorParamList } from "./types/PredictionsLiveAppNavigator";

const Stack = createNativeStackNavigator<PredictionsLiveAppNavigatorParamList>();

export default function PredictionsLiveAppNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig }}>
      <Stack.Screen
        name={ScreenName.Predictions}
        component={PredictionsLiveApp}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
