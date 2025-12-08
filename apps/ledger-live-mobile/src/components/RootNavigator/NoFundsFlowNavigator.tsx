import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import NoFunds from "../NoFunds/NoFunds";
import { ScreenName } from "~/const";
import type { NoFundsNavigatorParamList } from "./types/NoFundsNavigator";

const NoFundsFlowNavigator = () => {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.NoFunds}
        component={NoFunds}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const Stack = createNativeStackNavigator<NoFundsNavigatorParamList>();

export default NoFundsFlowNavigator;
