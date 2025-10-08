import * as React from "react";
import MarketNavigator, { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import MarketList from "../screens/MarketList";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();
const StackWalletTab = createNativeStackNavigator<MarketNavigatorStackParamList>();

export function MarketPages() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <WalletTabNavigatorScrollManager>
        <StackWalletTab.Navigator initialRouteName={ScreenName.MarketList}>
          <StackWalletTab.Screen name={ScreenName.MarketList} component={MarketList} />
          {MarketNavigator({ Stack })}
        </StackWalletTab.Navigator>
      </WalletTabNavigatorScrollManager>
    </QueryClientProvider>
  );
}
