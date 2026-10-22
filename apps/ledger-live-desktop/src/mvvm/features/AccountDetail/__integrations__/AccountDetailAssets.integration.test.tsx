import React from "react";
import { BigNumber } from "bignumber.js";
import { Route, Routes, useLocation } from "react-router";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

const ethAccount = genAccount("account-detail-assets-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 1,
  subAccountsCount: 0,
});
const ethAccountWithToken: Account = {
  ...ethAccount,
  subAccounts: [genTokenAccount(0, ethAccount, usdcToken)],
};
const emptyEthAccount: Account = {
  ...genAccount("account-detail-assets-empty-eth", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 0,
    subAccountsCount: 0,
  }),
  operationsCount: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
};

const CurrentPath = () => <div data-testid="current-path">{useLocation().pathname}</div>;

function renderAccount(account: Account) {
  return render(
    <>
      <Routes>
        <Route path="/account/:id/*" element={<AccountDetailRoute />} />
      </Routes>
      <CurrentPath />
    </>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts: [account],
      },
    },
  );
}

describe("AccountDetail assets section", () => {
  it("lists the native coin and the tokens of the account without a price column", async () => {
    renderAccount(ethAccountWithToken);

    const section = await screen.findByTestId("account-detail-assets");
    expect(within(section).getByText("Assets")).toBeVisible();
    expect(within(section).getByText("Ethereum")).toBeVisible();
    expect(within(section).getByText("USD Coin")).toBeVisible();
    expect(within(section).getByText("Balance")).toBeVisible();
    expect(within(section).getByText("Value")).toBeVisible();
    expect(within(section).queryByText("Price")).not.toBeInTheDocument();
  });

  it("does not navigate when a row is clicked", async () => {
    const { user } = renderAccount(ethAccountWithToken);

    const section = await screen.findByTestId("account-detail-assets");
    await user.click(within(section).getByText("USD Coin"));

    expect(screen.getByTestId("current-path")).toHaveTextContent(
      getAccountUrl(ethAccountWithToken.id),
    );
  });

  it("is hidden for an account without activity", async () => {
    renderAccount(emptyEthAccount);

    expect(await screen.findByTestId("account-detail-layout")).toBeVisible();
    expect(screen.queryByTestId("account-detail-assets")).not.toBeInTheDocument();
  });
});
