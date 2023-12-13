import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StakeFlow from "../Stake";
import { ScreenName } from "~/const";
import type { StakeNavigatorParamList } from "./types/StakeNavigator";

const StakeFlowNavigator = () => {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig} detachInactiveScreens>
      <Stack.Screen
        name={ScreenName.Stake}
        component={StakeFlow}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const Stack = createStackNavigator<StakeNavigatorParamList>();

export default StakeFlowNavigator;
