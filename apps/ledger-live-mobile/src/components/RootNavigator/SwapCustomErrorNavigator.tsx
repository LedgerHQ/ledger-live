import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import styles from "~/navigation/styles";
import { ScreenName } from "~/const";

import { SwapCustomErrorNavigatorParamList } from "./types/SwapCustomErrorNavigator";
import SwapCustomError from "~/screens/SwapCustomError";

export default function SwapCustomErrorNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: false }}>
      <Stack.Screen
        name={ScreenName.SwapCustomErrorScreen}
        component={SwapCustomError}
        options={{
          headerStyle: styles.headerNoShadow,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<SwapCustomErrorNavigatorParamList>();
