import React from "react";
import { NavigatorName } from "~/const";
import PortfolioNavigator from "../PortfolioNavigator";
import SwapNavigator from "../SwapNavigator";
import EarnLiveAppNavigator from "../EarnLiveAppNavigator";
import CardLandingNavigator from "LLM/features/Card";
import { Tab } from "./tabNavigator";
import type { Wallet40TabNavigatorProps } from "./types";
import { SwapWallet40Header } from "~/screens/Swap/LiveApp/components/SwapWallet40Header";
import { resetSwapWallet40HeaderState } from "~/screens/Swap/LiveApp/navigationHandlers/wallet40/useSwapWallet40HeaderState";

function Wallet40SwapTabHeader() {
  return <SwapWallet40Header />;
}

export function Wallet40TabNavigator({
  tabBar,
  screenOptions,
  rebornFlowListener,
}: Readonly<
  Wallet40TabNavigatorProps & {
    rebornFlowListener: (e: { preventDefault: () => void }) => void;
  }
>): React.JSX.Element {
  return (
    <Tab.Navigator tabBar={tabBar} screenOptions={screenOptions}>
      <Tab.Screen name={NavigatorName.Portfolio} component={PortfolioNavigator} />
      <Tab.Screen
        name={NavigatorName.Swap}
        component={SwapNavigator}
        options={{
          header: Wallet40SwapTabHeader,
        }}
        listeners={() => ({
          tabPress: e => {
            // Prevent stale opaque header state when re-entering the Swap tab.
            resetSwapWallet40HeaderState();
            rebornFlowListener(e);
          },
        })}
      />
      <Tab.Screen name={NavigatorName.Earn} component={EarnLiveAppNavigator} />
      <Tab.Screen name={NavigatorName.CardTab} component={CardLandingNavigator} />
    </Tab.Navigator>
  );
}
