import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { PtxNavigatorParamList } from "~/components/RootNavigator/types/PtxNavigator";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import styles from "~/navigation/styles";
import { CardLandingScreen } from "./screens/CardLandingScreen";
import { CardLiveAppScreen } from "./screens/CardLiveAppScreen";
import type { CardLandingNavigatorParamList } from "./types";

const TabStack = createNativeStackNavigator<CardLandingNavigatorParamList>();
const LiveAppStack = createNativeStackNavigator<PtxNavigatorParamList>();

export default function CardNavigator() {
  return (
    <TabStack.Navigator screenOptions={{ headerShown: false }}>
      <TabStack.Screen name={ScreenName.Card} component={CardLandingScreen} />
    </TabStack.Navigator>
  );
}

export function CardLiveAppNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <LiveAppStack.Navigator {...stackNavigationConfig}>
      <LiveAppStack.Screen
        name={ScreenName.Card}
        options={{
          headerStyle: styles.headerNoShadow,
          title: "",
        }}
      >
        {props => <CardLiveAppScreen {...props} />}
      </LiveAppStack.Screen>
    </LiveAppStack.Navigator>
  );
}
