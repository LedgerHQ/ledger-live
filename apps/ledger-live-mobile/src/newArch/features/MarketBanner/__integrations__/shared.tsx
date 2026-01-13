import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { ScreenName } from "~/const";
import MarketBanner from "../index";
import { View } from "react-native";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";

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

export const MOCK_MARKET_PERFORMERS = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    ticker: "BTC",
    image: "https://example.com/btc.png",
    price: 45000,
    priceChangePercentage24h: 5.5,
    priceChangePercentage7d: 12.3,
    priceChangePercentage30d: 25.0,
    priceChangePercentage1y: 150.0,
    ledgerIds: ["bitcoin"],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    image: "https://example.com/eth.png",
    price: 3000,
    priceChangePercentage24h: 3.2,
    priceChangePercentage7d: 8.5,
    priceChangePercentage30d: 15.0,
    priceChangePercentage1y: 80.0,
    ledgerIds: ["ethereum"],
  },
  {
    id: "solana",
    name: "Solana",
    ticker: "SOL",
    image: "https://example.com/sol.png",
    price: 100,
    priceChangePercentage24h: 8.1,
    priceChangePercentage7d: 20.0,
    priceChangePercentage30d: 45.0,
    priceChangePercentage1y: 200.0,
    ledgerIds: ["solana"],
  },
  {
    id: "cardano",
    name: "Cardano",
    ticker: "ADA",
    image: null,
    price: 0.5,
    priceChangePercentage24h: 2.0,
    priceChangePercentage7d: 5.0,
    priceChangePercentage30d: 10.0,
    priceChangePercentage1y: 50.0,
    ledgerIds: ["cardano"],
  },
  {
    id: "polkadot",
    name: "Polkadot",
    ticker: "DOT",
    image: "https://example.com/dot.png",
    price: 7,
    priceChangePercentage24h: -1.5,
    priceChangePercentage7d: 3.0,
    priceChangePercentage30d: 8.0,
    priceChangePercentage1y: 30.0,
    ledgerIds: ["polkadot"],
  },
  {
    id: "avalanche",
    name: "Avalanche",
    ticker: "AVAX",
    image: "https://example.com/avax.png",
    price: 35,
    priceChangePercentage24h: 6.0,
    priceChangePercentage7d: 15.0,
    priceChangePercentage30d: 30.0,
    priceChangePercentage1y: 120.0,
    ledgerIds: ["avalanche-c-chain"],
  },
  {
    id: "chainlink",
    name: "Chainlink",
    ticker: "LINK",
    image: "https://example.com/link.png",
    price: 15,
    priceChangePercentage24h: 4.0,
    priceChangePercentage7d: 10.0,
    priceChangePercentage30d: 20.0,
    priceChangePercentage1y: 70.0,
    ledgerIds: ["chainlink"],
  },
];
