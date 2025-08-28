import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StakeFlow from "../Stake";
import { ScreenName } from "~/const";
import type { StakeNavigatorParamList } from "./types/StakeNavigator";

const StakeFlowNavigator = () => {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.Stake}
        component={StakeFlow}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const Stack = createNativeStackNavigator<StakeNavigatorParamList>();

export default StakeFlowNavigator;
