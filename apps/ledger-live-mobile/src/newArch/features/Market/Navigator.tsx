import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import MarketList from "LLM/features/Market/screens/MarketList/MarketListCont";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";

export type MarketNavigatorStackParamList = {
  [ScreenName.MarketList]: { top100?: boolean };
};

const { Screen, Navigator } = createStackNavigator<MarketNavigatorStackParamList>();

function MarketNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = getStackNavigatorConfig(colors, true);

  const headerConfig = {
    headerShown: true,
    title: "",
    headerRight: undefined,
    headerLeft: () => null,
    headerTransparent: true,
  };

  return (
    <Navigator screenOptions={stackNavigationConfig} initialRouteName={ScreenName.MarketList}>
      <Screen name={ScreenName.MarketList} component={MarketList} options={headerConfig} />
    </Navigator>
  );
}

export default MarketNavigator;
