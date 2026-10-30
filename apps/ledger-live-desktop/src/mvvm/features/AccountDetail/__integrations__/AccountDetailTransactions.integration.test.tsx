import React from "react";
import { Route, Routes, useLocation } from "react-router";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { connectAccounts } from "~/config/account-data-setup";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

jest.mock("@ledgerhq/live-common/account-data/full-sync/syncLegacyAccount", () => ({
  syncLegacyAccount: () => Promise.resolve(),
}));

jest.mock("LLD/features/History/constants", () => ({
  ...jest.requireActual("LLD/features/History/constants"),
  USE_ACCOUNT_DATA_OPERATIONS: true,
}));

const ethRoot = genAccount("account-detail-transactions-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
  subAccountsCount: 0,
});
const usdcAccount = genTokenAccount(0, ethRoot, usdcToken);
const ethAccount: Account = { ...ethRoot, subAccounts: [usdcAccount] };
const otherEthAccount = genAccount("account-detail-transactions-other", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 5,
  subAccountsCount: 0,
});
const emptyBtcAccount = genAccount("account-detail-transactions-empty", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

function HistoryPage() {
  const { pathname, search } = useLocation();
  return <div data-testid="history-page">{`${pathname}${search}`}</div>;
}

function renderAccount(account: Account) {
  const store = createStore({
    state: {
      ...withFlagOverrides({ accountDetail: { enabled: true } }),
      accounts: [ethAccount, otherEthAccount, emptyBtcAccount],
    } as State,
    dbMiddleware,
    fetchRemoteFlags: null,
  });
  connectAccounts(store);

  return render(
    <Routes>
      <Route path="/account/:id/*" element={<AccountDetailRoute />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>,
    {
      store,
      initialRoute: getAccountUrl(account.id),
    },
  );
}

describe("AccountDetail transactions", () => {
  it("lists the 3 latest operations of the account and its tokens", async () => {
    const { store } = renderAccount(ethAccount);

    const section = await screen.findByTestId("account-detail-transactions-section");
    expect(
      Object.values(store.getState().accountOperations).some(rows => (rows?.length ?? 0) > 0),
    ).toBe(true);
    const rows = within(section).getAllByTestId(/^history-operation-row-/);

    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row).toBeVisible();
      expect(within(row).getByTestId("history-operation-type")).toBeVisible();
      expect(within(row).getByTestId("history-operation-amount")).toBeVisible();
    }
  });

  it("opens the history scoped to the account from the section header", async () => {
    const { user } = renderAccount(ethAccount);

    await user.click(await screen.findByTestId("account-detail-transactions-header"));

    const ids = encodeURIComponent(`${ethAccount.id},${usdcAccount.id}`);
    expect(await screen.findByTestId("history-page")).toHaveTextContent(
      `/history?accountIds=${ids}`,
    );
  });

  it("hides the section when the account has no operations", async () => {
    renderAccount(emptyBtcAccount);

    expect(await screen.findByTestId("account-detail-layout")).toBeVisible();
    expect(screen.queryByTestId("account-detail-transactions-section")).not.toBeInTheDocument();
  });
});
