import React from "react";
import { NavigatorName } from "~/const";
import PortfolioNavigator from "../PortfolioNavigator";
import SwapNavigator from "../SwapNavigator";
import EarnLiveAppNavigator from "../EarnLiveAppNavigator";
import CardLandingNavigator from "LLM/features/Card";
import { Tab } from "./tabNavigator";
import type { Wallet40TabNavigatorProps } from "./types";

export function Wallet40TabNavigator({
  tabBar,
  screenOptions,
}: Readonly<Wallet40TabNavigatorProps>): React.JSX.Element {
  return (
    <Tab.Navigator tabBar={tabBar} screenOptions={screenOptions}>
      <Tab.Screen name={NavigatorName.Portfolio} component={PortfolioNavigator} />
      <Tab.Screen name={NavigatorName.Swap} component={SwapNavigator} />
      <Tab.Screen name={NavigatorName.Earn} component={EarnLiveAppNavigator} />
      <Tab.Screen name={NavigatorName.CardTab} component={CardLandingNavigator} />
    </Tab.Navigator>
  );
}
