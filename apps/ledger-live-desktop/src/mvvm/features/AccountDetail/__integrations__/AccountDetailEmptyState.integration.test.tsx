import React from "react";
import { BigNumber } from "bignumber.js";
import { Route, Routes } from "react-router";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({ data: ["ethereum"], isResolved: true }),
}));

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeCurrency: () => false,
    getCanStakeUsingLedgerLive: () => false,
    getRouteToPlatformApp: () => null,
  }),
}));

const EMPTY_STATE = "account-detail-empty-state";
const ASSETS = "account-detail-assets";

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
  pendingOperations: [],
};

function renderAccount(account: Account) {
  return render(
    <Routes>
      <Route path="/account/:id/*" element={<AccountDetailRoute />} />
    </Routes>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts: [account],
      },
    },
  );
}

describe("AccountDetail empty state", () => {
  beforeEach(() => {
    jest.mocked(useRampCatalog).mockReturnValue({
      isCurrencyAvailable: () => true,
      getSupportedCryptoCurrencyIds: () => ["ethereum"],
    } as unknown as ReturnType<typeof useRampCatalog>);
  });

  it("replaces the sections with the empty state for a never used account", async () => {
    renderAccount(neverUsedAccount);

    expect(await screen.findByTestId(EMPTY_STATE)).toBeVisible();
    expect(screen.getByText("No activity yet")).toBeVisible();
    expect(screen.getByText("Start by adding funds through Receive, Swap or Buy.")).toBeVisible();
    expect(screen.queryByTestId(ASSETS)).toBeNull();
    expect(screen.getByTestId("account-detail-hero")).toBeVisible();
  });

  it("keeps the sections for an account used then emptied", async () => {
    renderAccount(emptied(usedAccount));

    expect(await screen.findByTestId(ASSETS)).toBeVisible();
    expect(screen.queryByTestId(EMPTY_STATE)).toBeNull();
  });

  it("leaves the empty state once a first transaction is pending", async () => {
    const [pending]: Operation[] = usedAccount.operations;
    renderAccount({ ...neverUsedAccount, pendingOperations: [pending] });

    expect(await screen.findByTestId(ASSETS)).toBeVisible();
    expect(screen.queryByTestId(EMPTY_STATE)).toBeNull();
  });
});
