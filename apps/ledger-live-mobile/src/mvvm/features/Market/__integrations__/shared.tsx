import * as React from "react";
import type { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import MarketList from "../screens/MarketList";
import MarketDetail from "../screens/MarketDetail";
import MarketCurrencySelect from "../screens/MarketCurrencySelect";

const StackWalletTab = createNativeStackNavigator<MarketNavigatorStackParamList>();

export function MarketPages() {
  return (
    <WalletTabNavigatorScrollManager>
      <StackWalletTab.Navigator initialRouteName={ScreenName.MarketList}>
        <StackWalletTab.Screen name={ScreenName.MarketList} component={MarketList} />
        <StackWalletTab.Screen name={ScreenName.MarketDetail} component={MarketDetail} />
        <StackWalletTab.Screen
          name={ScreenName.MarketCurrencySelect}
          component={MarketCurrencySelect}
        />
      </StackWalletTab.Navigator>
    </WalletTabNavigatorScrollManager>
  );
}
