import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import EarnSimulator from "./screens/EarnSimulator";
import type { EarnSimulatorNavigatorParamsList } from "./types";

const Stack = createNativeStackNavigator<EarnSimulatorNavigatorParamsList>();

export default function EarnSimulatorNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.EarnSimulator}
        component={EarnSimulator}
        options={{
          headerTitle: t("earn.simulator.title"),
          headerLeft: () => <NavigationHeaderBackButton />,
          headerRight: () => null,
        }}
      />
    </Stack.Navigator>
  );
}
