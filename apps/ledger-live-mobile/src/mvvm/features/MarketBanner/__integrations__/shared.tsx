import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { ScreenName } from "~/const";
import MarketBanner from "../index";
import { View } from "react-native";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

export { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";

type TestStackParamList = MarketNavigatorStackParamList & { TestScreen: undefined };

const Stack = createNativeStackNavigator<TestStackParamList>();

const TestScreen = () => (
  <View testID="test-screen">
    <MarketBanner />
  </View>
);

const MarketListScreen = () => <View testID="market-list-screen" />;

const MarketDetailScreen = () => <View testID="market-detail-screen" />;

export const MarketBannerTest = () => (
  <RampCatalogProvider updateFrequency={60000}>
    <Stack.Navigator initialRouteName="TestScreen">
      <Stack.Screen name="TestScreen" component={TestScreen} />
      <Stack.Screen name={ScreenName.MarketList} component={MarketListScreen} />
      <Stack.Screen name={ScreenName.MarketDetail} component={MarketDetailScreen} />
    </Stack.Navigator>
  </RampCatalogProvider>
);
