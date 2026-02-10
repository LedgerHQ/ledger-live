import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { State } from "~/reducers/types";
import { NavigatorName } from "~/const";
import SendWorkflow from "../index";

const Stack = createNativeStackNavigator();

export const TestSendFlowWrapper: React.FC<{
  initialParams?: Record<string, unknown>;
}> = ({ initialParams }) => (
  <Stack.Navigator initialRouteName={NavigatorName.SendFlow} screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name={NavigatorName.SendFlow}
      component={SendWorkflow}
      initialParams={initialParams}
    />
  </Stack.Navigator>
);

export const mockBitcoinCurrency = getCryptoCurrencyById("bitcoin");
export const mockEthereumCurrency = getCryptoCurrencyById("ethereum");

export const createMockAccount = (currency: CryptoCurrency, id: string): Account =>
  genAccount(id, { currency, operationsSize: 0 });

export const overrideStateWithAccounts = (state: State): State => {
  const btcAccount = createMockAccount(mockBitcoinCurrency, "btc-1");
  const ethAccount = createMockAccount(mockEthereumCurrency, "eth-1");

  return {
    ...state,
    accounts: {
      ...state.accounts,
      active: [btcAccount, ethAccount],
    },
  };
};
