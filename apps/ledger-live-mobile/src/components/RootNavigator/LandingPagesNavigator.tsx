import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { LandingPagesNavigatorParamList } from "./types/LandingPagesNavigator";
import GenericLandingPage from "~/newArch/features/LandingPages/screens/GenericLandingPage";
import { NavigationHeaderCloseButton } from "../NavigationHeaderCloseButton";

const Stack = createStackNavigator<LandingPagesNavigatorParamList>();

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
    </Stack.Navigator>
  );
}
