import React, { useState } from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { Button } from "@ledgerhq/native-ui";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import { cancelMigrationRequest } from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import { render, screen, waitFor, withReadOnlyDisabled } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { State } from "~/reducers/types";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { usePerpsHandlers } from "../hooks/usePerpsHandlers";

// The drawer's own steps, Add account included, are covered by the ModularDrawer integration
// tests. Here the drawer is driven through its controller, as its UI would.

const legacyAccount = genAccount("perps-legacy", { currency: getCryptoCurrencyById("arbitrum") });
const existingAccount = genAccount("perps-hc-existing", {
  currency: getCryptoCurrencyById("hypercore"),
});
const addedAccount = genAccount("perps-hc-added", { currency: getCryptoCurrencyById("hypercore") });

const MIGRATE = "Migrate";
const SELECT_EXISTING = "Select existing";
const SELECT_ADDED = "Select added";
const CLOSE_DRAWER = "Close drawer";
const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

/** Stands in for the Perps live app and the drawer UI. */
function PerpsScreen({ accounts }: Readonly<{ accounts: Account[] }>) {
  const handlers = usePerpsHandlers(accounts);
  const { isOpen, preselectedCurrencies, handleAccountSelected, closeDrawer } =
    useModularDrawerController();
  const [outcome, setOutcome] = useState("pending");

  const migrate = () => {
    const migrateAccount = handlers["custom.perps.migrateAccount"] as (req: {
      params: { legacyAccountId: string };
    }) => Promise<{ accounts: { accountId: string; created: boolean }[] }>;
    migrateAccount({
      params: { legacyAccountId: getWalletApiIdFromAccountId(legacyAccount.id) },
    }).then(
      result => setOutcome(JSON.stringify(result)),
      (error: Error) => setOutcome(error.name),
    );
  };

  return (
    <>
      <Button type="main" onPress={migrate}>
        {MIGRATE}
      </Button>
      <Text testID="drawer">{isOpen ? `open:${preselectedCurrencies.join(",")}` : "closed"}</Text>
      <Button type="main" onPress={() => handleAccountSelected(existingAccount)}>
        {SELECT_EXISTING}
      </Button>
      <Button type="main" onPress={() => handleAccountSelected(addedAccount)}>
        {SELECT_ADDED}
      </Button>
      <Button type="main" onPress={closeDrawer}>
        {CLOSE_DRAWER}
      </Button>
      <Text testID="migration-outcome">{outcome}</Text>
    </>
  );
}

function Harness({ accounts }: Readonly<{ accounts: Account[] }>) {
  return (
    <Stack.Navigator initialRouteName={ScreenName.MockedModularDrawer}>
      <Stack.Screen name={ScreenName.MockedModularDrawer}>
        {() => <PerpsScreen accounts={accounts} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const renderWith = (accounts: Account[]) =>
  render(<Harness accounts={accounts} />, {
    overrideInitialState: (state: State) =>
      withReadOnlyDisabled({ ...state, accounts: { active: accounts } }),
  });

const expectOutcome = (text: string) =>
  waitFor(() => expect(screen.getByTestId("migration-outcome")).toHaveTextContent(text));

describe("Perps migration integration", () => {
  beforeAll(() =>
    [legacyAccount, existingAccount, addedAccount].forEach(account =>
      setWalletApiIdForAccountId(account.id),
    ),
  );
  afterEach(() => cancelMigrationRequest());

  it("opens the hypercore account drawer", async () => {
    const { user } = renderWith([legacyAccount]);

    await user.press(screen.getByText(MIGRATE));

    expect(screen.getByTestId("drawer")).toHaveTextContent("open:hypercore");
  });

  it("hands the Hyperliquid account the user picks to the live app as not created", async () => {
    const { user } = renderWith([legacyAccount, existingAccount]);

    await user.press(screen.getByText(MIGRATE));
    await user.press(screen.getByText(SELECT_EXISTING));

    await expectOutcome(
      JSON.stringify({
        accounts: [{ accountId: getWalletApiIdFromAccountId(existingAccount.id), created: false }],
      }),
    );
    expect(screen.getByTestId("drawer")).toHaveTextContent("closed");
  });

  it("hands an account added from the drawer to the live app as created", async () => {
    const { user } = renderWith([legacyAccount, existingAccount]);

    await user.press(screen.getByText(MIGRATE));
    await user.press(screen.getByText(SELECT_ADDED));

    await expectOutcome(
      JSON.stringify({
        accounts: [{ accountId: getWalletApiIdFromAccountId(addedAccount.id), created: true }],
      }),
    );
  });

  it("cancels when the user closes the drawer or abandons Add account", async () => {
    const { user } = renderWith([legacyAccount]);

    await user.press(screen.getByText(MIGRATE));
    await user.press(screen.getByText(CLOSE_DRAWER));

    await expectOutcome("UserRefusedOnDevice");
  });
});
