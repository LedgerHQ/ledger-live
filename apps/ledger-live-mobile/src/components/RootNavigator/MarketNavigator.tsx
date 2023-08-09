import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ScreenName } from "../../const";
import MarketList from "../../screens/Market";
import MarketDetail from "../../screens/Market/MarketDetail";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { MarketNavigatorStackParamList } from "./types/MarketNavigator";

export default function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const ptxEarnFeature = useFeature("ptxEarn");
  const headerConfig = ptxEarnFeature?.enabled
    ? {
        headerShown: true,
        title: "",
        headerRight: undefined,
      }
    : {
        headerShown: false,
      };

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Stack.Screen name={ScreenName.MarketList} component={MarketList} options={headerConfig} />
      <Stack.Screen
        name={ScreenName.MarketDetail}
        component={MarketDetail}
        options={headerConfig}
      />
    </Stack.Navigator>
  );
}
const Stack = createStackNavigator<MarketNavigatorStackParamList>();
