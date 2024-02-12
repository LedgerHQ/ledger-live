import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import NoFunds from "../NoFunds/NoFunds";
import { ScreenName } from "~/const";
import type { NoFundsNavigatorParamList } from "./types/NoFundsNavigator";

const NoFundsFlowNavigator = () => {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig} detachInactiveScreens>
      <Stack.Screen
        name={ScreenName.NoFunds}
        component={NoFunds}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const Stack = createStackNavigator<NoFundsNavigatorParamList>();

export default NoFundsFlowNavigator;
