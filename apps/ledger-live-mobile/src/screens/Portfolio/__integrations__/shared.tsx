import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NavigatorName, ScreenName } from "~/const";
import { MockedAccounts } from "./mockedAccount";
import { State } from "~/reducers/types";
import AccountsNavigator from "LLM/features/Accounts/Navigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import AssetsNavigator from "LLM/features/Assets/Navigator";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

const TestNavigator = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <Stack.Navigator initialRouteName={ScreenName.MockedWalletScreen}>
      <Stack.Screen name={ScreenName.MockedWalletScreen}>{() => children}</Stack.Screen>
      <Stack.Screen
        name={NavigatorName.Assets}
        component={AssetsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Accounts}
        component={AccountsNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </QueryClientProvider>
);

export const SlicedMockedAccounts = {
  ...MockedAccounts,
  active: MockedAccounts.active.slice(0, 3),
};

export const BLACKLISTED_TOKEN_IDS = [
  "ethereum_classic/erc20/usd_tether",
  "ethereum_classic/erc20/usd_coin",
  "ethereum_classic/erc20/dai",
];

const ethereumClassicCurrency = MockedAccounts.active[4].currency;

const tokenSubAccounts = [
  {
    type: "TokenAccount" as const,
    id: "js:2:ethereum_classic:0x79D7D3119D60CC666E0DE76AB3A1BFEE46001EAF:+ethereum_classic%2Ferc20%2Fusd_tether",
    parentId: MockedAccounts.active[4].id,
    balance: BigNumber("50000000"),
    spendableBalance: BigNumber("50000000"),
    token: {
      type: "TokenCurrency" as const,
      id: "ethereum_classic/erc20/usd_tether",
      contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      tokenType: "erc20",
      parentCurrency: ethereumClassicCurrency,
      name: "Tether USD",
      ticker: "USDT",
      units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
    },
    creationDate: new Date("2024-11-13T12:20:06.444Z"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  },
  {
    type: "TokenAccount" as const,
    id: "js:2:ethereum_classic:0x79D7D3119D60CC666E0DE76AB3A1BFEE46001EAF:+ethereum_classic%2Ferc20%2Fusd_coin",
    parentId: MockedAccounts.active[4].id,
    balance: BigNumber("30000000"),
    spendableBalance: BigNumber("30000000"),
    token: {
      type: "TokenCurrency" as const,
      id: "ethereum_classic/erc20/usd_coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      tokenType: "erc20",
      parentCurrency: ethereumClassicCurrency,
      name: "USD Coin",
      ticker: "USDC",
      units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
    },
    creationDate: new Date("2024-11-13T12:20:06.444Z"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  },
  {
    type: "TokenAccount" as const,
    id: "js:2:ethereum_classic:0x79D7D3119D60CC666E0DE76AB3A1BFEE46001EAF:+ethereum_classic%2Ferc20%2Fdai",
    parentId: MockedAccounts.active[4].id,
    balance: BigNumber("20000000"),
    spendableBalance: BigNumber("20000000"),
    token: {
      type: "TokenCurrency" as const,
      id: "ethereum_classic/erc20/dai",
      contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      tokenType: "erc20",
      parentCurrency: ethereumClassicCurrency,
      name: "Dai Stablecoin",
      ticker: "DAI",
      units: [{ name: "DAI", code: "DAI", magnitude: 18 }],
    },
    creationDate: new Date("2024-11-13T12:20:06.444Z"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  },
];

const ethereumClassicWithTokens = {
  ...MockedAccounts.active[4],
  subAccounts: tokenSubAccounts,
};

/**
 * 4 crypto accounts (cronos, dash, dogecoin, ethereum_classic) where ethereum_classic
 * has 3 token sub-accounts (USDT, USDC, DAI).
 * Total distribution entries: 4 crypto + 3 tokens = 7.
 */
export const MockedAccountsWithTokens = {
  ...MockedAccounts,
  active: [
    MockedAccounts.active[0], // cronos
    MockedAccounts.active[1], // dash
    MockedAccounts.active[2], // dogecoin
    ethereumClassicWithTokens, // ethereum_classic + 3 token sub-accounts
  ],
};

export const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: MockedAccounts,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
      overriddenFeatureFlags: {
        llmAccountListUI: {
          enabled: true,
        },
      },
    },
  }),
};

export default TestNavigator;
