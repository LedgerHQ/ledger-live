import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { LandingPagesNavigatorParamList } from "./types/LandingPagesNavigator";
import GenericLandingPage from "LLM/features/LandingPages/screens/GenericLandingPage";
import { NavigationHeaderCloseButton } from "../NavigationHeaderCloseButton";
import { LargeMoverLandingPage } from "LLM/features/LandingPages/screens/LargeMoverLandingPage";

const Stack = createNativeStackNavigator<LandingPagesNavigatorParamList>();

export default function LandingPagesNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  const navigationOptions = {
    title: "",
    headerLeft: () => null,
    headerRight: () => <NavigationHeaderCloseButton />,
  };

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.GenericLandingPage}
        component={GenericLandingPage}
        options={navigationOptions}
      />
      <Stack.Screen
        name={ScreenName.LargeMoverLandingPage}
        component={LargeMoverLandingPage}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
