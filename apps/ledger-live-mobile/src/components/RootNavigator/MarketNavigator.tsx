import React, { useMemo, lazy } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { MarketNavigatorStackParamList } from "./types/MarketNavigator";
import { withSuspense } from "~/helpers/withSuspense";

const MarketList = lazy(() => import("../../screens/Market"));
const MarketDetail = lazy(() => import("../../screens/Market/MarketDetail"));

export default function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const ptxEarnFeature = useFeature("ptxEarn");
  const headerConfig = ptxEarnFeature?.enabled
    ? {
      headerShown: true,
      title: "",
      headerRight: undefined,
      headerLeft: () => null,
    }
    : {
      headerShown: false,
    };

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Stack.Screen name={ScreenName.MarketList} component={withSuspense(MarketList)} options={headerConfig} />
      <Stack.Screen
        name={ScreenName.MarketDetail}
        component={withSuspense(MarketDetail)}
        options={headerConfig}
      />
    </Stack.Navigator>
  );
}
const Stack = createStackNavigator<MarketNavigatorStackParamList>();
