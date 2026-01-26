import * as React from "react";
import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MarketNavigator, { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import MarketList from "../screens/MarketList";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();
const StackWalletTab = createNativeStackNavigator<MarketNavigatorStackParamList>();

export function MarketPages() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletTabNavigatorScrollManager>
        <StackWalletTab.Navigator initialRouteName={ScreenName.MarketList}>
          <StackWalletTab.Screen name={ScreenName.MarketList} component={MarketList} />
          {MarketNavigator({ Stack })}
        </StackWalletTab.Navigator>
      </WalletTabNavigatorScrollManager>
    </QueryClientProvider>
  );
}
