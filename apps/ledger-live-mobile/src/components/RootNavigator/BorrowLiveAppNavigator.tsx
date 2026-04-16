import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { BorrowLiveAppNavigatorParamList } from "./types/BorrowLiveAppNavigator";
import { BorrowLiveAppWrapper } from "LLM/features/Borrow";

const Stack = createNativeStackNavigator<BorrowLiveAppNavigatorParamList>();

export default function BorrowLiveAppNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig }}>
      <Stack.Screen
        name={ScreenName.Borrow}
        component={BorrowLiveAppWrapper}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
