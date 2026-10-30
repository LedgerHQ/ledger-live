import React from "react";
import { BigNumber } from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ getSupportedCryptoCurrencyIds: () => ["ethereum"] }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({ data: ["ethereum"] }),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: () => ({ deactivatedCurrencyIds: new Set() }),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

const usedAccount = genAccount("account-detail-empty-state-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
  subAccountsCount: 0,
});

const emptied = (account: Account): Account => ({
  ...account,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
});

const neverUsedAccount: Account = {
  ...emptied(usedAccount),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
};

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccount(account: Account) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return { ...withFlag, accounts: { ...withFlag.accounts, active: [account] } };
      },
    },
  );
}

const tile = (id: string) => `${ACCOUNT_DETAIL_TEST_IDS.hero}-actions-${id}`;

describe("AccountDetail empty state", () => {
  it("replaces the sections with the empty state for a never used account", async () => {
    renderAccount(neverUsedAccount);

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.emptyState)).toBeVisible();
    expect(screen.getByText("No activity yet")).toBeVisible();
    expect(screen.getByText("Start by adding funds through Receive, Swap or Buy.")).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.assets)).toBeNull();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.transactions)).toBeNull();
  });

  it("centers the empty state in the space under the quick actions", async () => {
    renderAccount(neverUsedAccount);

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.emptyState)).toBeVisible();

    const scrollView = screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.scrollView);
    expect(scrollView.props.contentContainerStyle).toEqual(
      expect.objectContaining({ flexGrow: 1 }),
    );
    expect(scrollView.props.refreshControl).toBeTruthy();
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.emptyStateSlot).props.style).toEqual(
      expect.objectContaining({ flexGrow: 1, justifyContent: "center" }),
    );
  });

  it("offers Transfer, Swap and Buy above the empty state", async () => {
    renderAccount(neverUsedAccount);

    expect(await screen.findByTestId(tile("transfer"))).toBeVisible();
    expect(screen.getByTestId(tile("swap"))).toBeVisible();
    expect(screen.getByTestId(tile("buy"))).toBeVisible();
  });

  it("keeps the sections for an account used then emptied", async () => {
    renderAccount(emptied(usedAccount));

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.assets)).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.emptyState)).toBeNull();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.emptyStateSlot)).toBeNull();
    expect(
      screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.scrollView).props.contentContainerStyle,
    ).not.toEqual(expect.objectContaining({ flexGrow: 1 }));
  });

  it("leaves the empty state once a first transaction is pending", async () => {
    const [pending]: Operation[] = usedAccount.operations;
    renderAccount({ ...neverUsedAccount, pendingOperations: [pending] });

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.assets)).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.emptyState)).toBeNull();
  });
});
