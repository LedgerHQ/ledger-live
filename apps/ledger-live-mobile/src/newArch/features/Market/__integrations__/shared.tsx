import * as React from "react";
import MarketNavigator, { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { createStackNavigator } from "@react-navigation/stack";
import { ScreenName } from "~/const";
import MarketList from "../screens/MarketList";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

const Stack = createStackNavigator<BaseNavigatorStackParamList>();
const StackWalletTab = createStackNavigator<MarketNavigatorStackParamList>();

export function MarketPages() {
  return (
    <WalletTabNavigatorScrollManager>
      <StackWalletTab.Navigator initialRouteName={ScreenName.MarketList}>
        <StackWalletTab.Screen name={ScreenName.MarketList} component={MarketList} />
        {MarketNavigator({ Stack })}
      </StackWalletTab.Navigator>
    </WalletTabNavigatorScrollManager>
  );
}
