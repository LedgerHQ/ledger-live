import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import styles from "~/navigation/styles";
import { ScreenName } from "~/const";

import { CustomErrorNavigatorParamList } from "./types/CustomErrorNavigator";
import CustomError from "~/screens/CustomError";

export default function CustomErrorNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: false }}>
      <Stack.Screen
        name={ScreenName.CustomErrorScreen}
        component={CustomError}
        options={{
          headerStyle: styles.headerNoShadow,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<CustomErrorNavigatorParamList>();
