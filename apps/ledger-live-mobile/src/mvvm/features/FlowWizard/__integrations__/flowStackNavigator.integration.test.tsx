import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import type { Account } from "@ledgerhq/types-live";
import { State } from "~/reducers/types";
import { NavigatorName } from "~/const";
import SendWorkflow from "../../Send";

/**
 * FlowStackNavigator Integration Tests
 *
 * Tests the FlowWizard FlowStackNavigator through the Send flow,
 * which is the primary consumer. Verifies that the generic
 * stack-based flow navigation works correctly.
 */
const Stack = createNativeStackNavigator();

const TestWrapper: React.FC = () => (
  <Stack.Navigator initialRouteName={NavigatorName.SendFlow} screenOptions={{ headerShown: false }}>
    <Stack.Screen name={NavigatorName.SendFlow} component={SendWorkflow} />
  </Stack.Navigator>
);

const mockBitcoinCurrency = getCryptoCurrencyById("bitcoin");
const mockEthereumCurrency = getCryptoCurrencyById("ethereum");

const createMockAccount = (currency: typeof mockBitcoinCurrency, id: string): Account =>
  genAccount(id, { currency, operationsSize: 0 });

const overrideStateWithAccounts = (state: State): State => {
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

describe("FlowStackNavigator Integration Tests", () => {
  it("should render first step (Recipient) when flow opens", async () => {
    render(<TestWrapper />, {
      overrideInitialState: overrideStateWithAccounts,
    });

    await waitFor(() => {
      expect(screen.getByText(/recipient screen/i)).toBeVisible();
    });
  });

  it("should navigate between flow steps via FlowStackNavigator", async () => {
    const { user } = render(<TestWrapper />, {
      overrideInitialState: overrideStateWithAccounts,
    });

    await waitFor(() => {
      expect(screen.getByText(/recipient screen/i)).toBeVisible();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount screen/i)).toBeVisible();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirmation screen/i)).toBeVisible();
    });
  });
});
