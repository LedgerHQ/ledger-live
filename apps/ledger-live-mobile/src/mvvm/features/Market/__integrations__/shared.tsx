import * as React from "react";
import type { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import MarketList from "../screens/MarketList";
import MarketCurrencySelect from "../screens/MarketCurrencySelect";
import AssetDetailNavigator from "LLM/features/AssetDetail/Navigator";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";

const StackWalletTab = createNativeStackNavigator<MarketNavigatorStackParamList>();
const RootStack = createNativeStackNavigator();

function MarketStack() {
  return (
    <StackWalletTab.Navigator initialRouteName={ScreenName.MarketList}>
      <StackWalletTab.Screen name={ScreenName.MarketList} component={MarketList} />
      <StackWalletTab.Screen
        name={ScreenName.MarketCurrencySelect}
        component={MarketCurrencySelect}
      />
    </StackWalletTab.Navigator>
  );
}

export function MarketPages() {
  return (
    <NotificationsPromptProvider>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MarketTab" component={MarketStack} />
        <RootStack.Screen name={NavigatorName.AssetDetail} component={AssetDetailNavigator} />
      </RootStack.Navigator>
    </NotificationsPromptProvider>
  );
}
