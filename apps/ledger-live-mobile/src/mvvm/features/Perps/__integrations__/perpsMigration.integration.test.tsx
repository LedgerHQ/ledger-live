import React, { useState } from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
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
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { State } from "~/reducers/types";
import { usePerpsHandlers } from "../hooks/usePerpsHandlers";

// The add account screens are covered by the Accounts integration tests. Here they are stood in
// for by a screen calling back the way the inline flow does.

const legacyAccount = genAccount("perps-legacy", { currency: getCryptoCurrencyById("arbitrum") });
const hypercoreAt = (id: string, freshAddress: string): Account => ({
  ...genAccount(id, { currency: getCryptoCurrencyById("hypercore") }),
  freshAddress,
});
const matchingAccount = hypercoreAt("perps-hc-matching", legacyAccount.freshAddress);
const otherAccount = hypercoreAt("perps-hc-other", "0x0000000000000000000000000000000000000002");

const MIGRATE = "Migrate";
const ADD_MATCHING = "Add matching";
const ADD_OTHER = "Add other";
const CLOSE_FLOW = "Close flow";
const GO_BACK = "Go back";
const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

type AddAccountFlowParams = {
  params: {
    currency: { id: string };
    onSuccess: (res: { scannedAccounts: Account[]; selected: Account[] }) => void;
    onCloseNavigation: () => void;
  };
};

/** Stands in for the Perps live app. */
function PerpsScreen({ accounts }: Readonly<{ accounts: Account[] }>) {
  const handlers = usePerpsHandlers(accounts);
  const [outcome, setOutcome] = useState("pending");

  const migrate = () => {
    const migrateAccount = handlers["custom.perps.migrateAccount"] as (req: {
      params: { legacyAccountId: string };
    }) => Promise<{ accounts: { accountId: string; created: boolean }[] }>;
    migrateAccount({
      params: { legacyAccountId: getWalletApiIdFromAccountId(legacyAccount.id) },
    }).then(
      result => setOutcome(JSON.stringify(result)),
      (error: Error & { errorData?: { data?: { message?: string } } }) =>
        setOutcome(error.errorData?.data?.message ?? error.name),
    );
  };

  return (
    <>
      <Button type="main" onPress={migrate}>
        {MIGRATE}
      </Button>
      <Text testID="migration-outcome">{outcome}</Text>
    </>
  );
}

/** Stands in for the inline add account flow. */
function AddAccountFlowScreen() {
  const navigation = useNavigation();
  const { params } = useRoute().params as AddAccountFlowParams;

  const add = (account: Account) => {
    navigation.goBack();
    params.onSuccess({ scannedAccounts: [account], selected: [account] });
  };

  return (
    <>
      <Text testID="add-account-flow">{params.currency.id}</Text>
      <Button type="main" onPress={() => add(matchingAccount)}>
        {ADD_MATCHING}
      </Button>
      <Button type="main" onPress={() => add(otherAccount)}>
        {ADD_OTHER}
      </Button>
      <Button
        type="main"
        onPress={() => {
          params.onCloseNavigation();
          navigation.goBack();
        }}
      >
        {CLOSE_FLOW}
      </Button>
      <Button type="main" onPress={() => navigation.goBack()}>
        {GO_BACK}
      </Button>
    </>
  );
}

function Harness({ accounts }: Readonly<{ accounts: Account[] }>) {
  return (
    <Stack.Navigator initialRouteName={ScreenName.MockedModularDrawer}>
      <Stack.Screen name={ScreenName.MockedModularDrawer}>
        {() => <PerpsScreen accounts={accounts} />}
      </Stack.Screen>
      <Stack.Screen name={NavigatorName.DeviceSelection} component={AddAccountFlowScreen} />
    </Stack.Navigator>
  );
}

const renderWith = (accounts: Account[]) =>
  render(<Harness accounts={accounts} />, {
    overrideInitialState: (state: State) =>
      withReadOnlyDisabled({ ...state, accounts: { active: accounts } }),
  });

const outcome = () => screen.getByTestId("migration-outcome");

const migratedTo = (account: Account, created: boolean) =>
  JSON.stringify({ accounts: [{ accountId: getWalletApiIdFromAccountId(account.id), created }] });

describe("Perps migration integration", () => {
  beforeAll(() =>
    [legacyAccount, matchingAccount, otherAccount].forEach(account =>
      setWalletApiIdForAccountId(account.id),
    ),
  );
  afterEach(() => cancelMigrationRequest());

  it("hands the Hyperliquid account at the legacy address over without opening Add account", async () => {
    const { user } = renderWith([legacyAccount, otherAccount, matchingAccount]);

    await user.press(screen.getByText(MIGRATE));

    await waitFor(() => expect(outcome()).toHaveTextContent(migratedTo(matchingAccount, false)));
    expect(screen.queryByTestId("add-account-flow")).toBeNull();
  });

  it("opens Add account for Hyperliquid when no account is at the legacy address", async () => {
    const { user } = renderWith([legacyAccount, otherAccount]);

    await user.press(screen.getByText(MIGRATE));

    expect(await screen.findByTestId("add-account-flow")).toHaveTextContent("hypercore");
  });

  it("hands the added account at the legacy address over as created", async () => {
    const { user } = renderWith([legacyAccount]);

    await user.press(screen.getByText(MIGRATE));
    await user.press(await screen.findByText(ADD_MATCHING));

    await waitFor(() => expect(outcome()).toHaveTextContent(migratedTo(matchingAccount, true)));
  });

  it("fails when the added account is at another address", async () => {
    const { user } = renderWith([legacyAccount]);

    await user.press(screen.getByText(MIGRATE));
    await user.press(await screen.findByText(ADD_OTHER));

    await waitFor(() => expect(outcome()).toHaveTextContent(/legacy Perps account address/));
  });

  it("cancels when the user closes Add account", async () => {
    const { user } = renderWith([legacyAccount]);

    await user.press(screen.getByText(MIGRATE));
    await user.press(await screen.findByText(CLOSE_FLOW));

    await waitFor(() => expect(outcome()).toHaveTextContent("UserRefusedOnDevice"));
  });

  it("cancels when the user goes back to Perps without adding an account", async () => {
    const { user } = renderWith([legacyAccount]);

    await user.press(screen.getByText(MIGRATE));
    await user.press(await screen.findByText(GO_BACK));

    await waitFor(() => expect(outcome()).toHaveTextContent("UserRefusedOnDevice"));
  });
});
