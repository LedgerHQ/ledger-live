import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { CardLandingScreen } from "LLM/features/CardLanding";
import type { CardLandingNavigatorParamList } from "./types/CardLandingNavigator";

const Stack = createNativeStackNavigator<CardLandingNavigatorParamList>();

export default function CardLandingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.Card} component={CardLandingScreen} />
    </Stack.Navigator>
  );
}
