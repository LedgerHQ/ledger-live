import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { screen, within } from "@tests/test-renderer";
import { QuickActionsCtas } from "../components/QuickActionsCtas";
import { TransferDrawer } from "../screens/TransferDrawer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { QUICK_ACTIONS_TEST_IDS } from "../testIds";

type TestStackParamList = WalletTabNavigatorStackParamList;

const Stack = createNativeStackNavigator<TestStackParamList>();

const QuickActionsTestScreen = () => (
  <>
    <QuickActionsCtas />
    <TransferDrawer />
  </>
);

export const TestQuickActionsWrapper = () => (
  <Stack.Navigator initialRouteName={ScreenName.Portfolio}>
    <Stack.Screen name={ScreenName.Portfolio} component={QuickActionsTestScreen} />
  </Stack.Navigator>
);

export const mockBitcoinCurrency = getCryptoCurrencyById("bitcoin");
export const mockEthereumCurrency = getCryptoCurrencyById("ethereum");

export const createMockAccount = (currency: CryptoCurrency, id: string): Account => {
  return genAccount(id, { currency, operationsSize: 3 });
};

export const overrideStateWithFunds = (state: State): State => {
  const btcAccount = createMockAccount(mockBitcoinCurrency, "btc-1");
  const ethAccount = createMockAccount(mockEthereumCurrency, "eth-1");

  return {
    ...state,
    accounts: {
      ...state.accounts,
      active: [btcAccount, ethAccount],
    },
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
      overriddenFeatureFlags: {
        ptxServiceCtaExchangeDrawer: { enabled: true },
        noah: { enabled: true },
      },
    },
  };
};

export const overrideStateWithoutFunds = (state: State): State => ({
  ...state,
  accounts: {
    ...state.accounts,
    active: [],
  },
  settings: {
    ...state.settings,
    readOnlyModeEnabled: false,
    overriddenFeatureFlags: {
      ptxServiceCtaExchangeDrawer: { enabled: true },
      noah: { enabled: true },
    },
  },
});

export const overrideStateNoSigner = (state: State): State => ({
  ...state,
  accounts: {
    ...state.accounts,
    active: [],
  },
  settings: {
    ...state.settings,
    readOnlyModeEnabled: true,
    overriddenFeatureFlags: {
      ptxServiceCtaExchangeDrawer: { enabled: true },
      noah: { enabled: true },
    },
  },
});

export const overrideStateReadOnly = (state: State): State => {
  const btcAccount = createMockAccount(mockBitcoinCurrency, "btc-1");

  return {
    ...state,
    accounts: {
      ...state.accounts,
      active: [btcAccount],
    },
    settings: {
      ...state.settings,
      readOnlyModeEnabled: true,
      overriddenFeatureFlags: {
        ptxServiceCtaExchangeDrawer: { enabled: true },
        noah: { enabled: true },
      },
    },
  };
};

export const getCtaButtons = async () => {
  const container = await screen.findByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container);
  return {
    container,
    transferButton: within(container).getByRole("button", { name: /transfer/i }),
    swapButton: within(container).getByRole("button", { name: /swap/i }),
    buyButton: within(container).getByRole("button", { name: /buy/i }),
  };
};

export const getNoSignerCtaButtons = async () => {
  const container = await screen.findByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container);
  return {
    container,
    connectButton: within(container).getByRole("button", { name: /connect/i }),
    buyLedgerButton: within(container).getByRole("button", { name: /buy a ledger/i }),
  };
};
