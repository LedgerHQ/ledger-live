import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { act, render, screen } from "tests/testSetup";
import CardFundRoot, { openCardFund } from "../screens/CardFund/CardFundDialog";

const parentAccount = genAccount("ethereum-account", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});
const sourceAccount = {
  ...genTokenAccount(0, parentAccount, usdcToken),
  balance: new BigNumber(100_000_000),
  spendableBalance: new BigNumber(100_000_000),
};
parentAccount.subAccounts = [sourceAccount];

const asset = {
  id: "card-wallet",
  address: "0x2222222222222222222222222222222222222222",
  currency: "usdc",
  network: "ethereum",
  name: "USD Coin",
  ticker: "USDC",
  ledgerId: usdcToken.id,
  cryptoAmount: "50 USDC",
  countervalue: "$50.00",
  countervalueAmount: 50,
};

function renderFundDialog() {
  const rendered = render(<CardFundRoot />, {
    initialState: { accounts: [parentAccount] },
  });

  act(() => {
    openCardFund({ account: sourceAccount, parentAccount, asset });
  });

  return rendered;
}

it("starts the form with the selected linked-wallet address", () => {
  renderFundDialog();

  expect(screen.getByRole("dialog", { name: "Top up USD Coin" })).toBeVisible();
  expect(screen.getByTestId("card-fund-destination")).toHaveTextContent(asset.address);
});

it("enables Fund after a valid amount is entered", async () => {
  const { user } = renderFundDialog();

  const submit = screen.getByTestId("card-fund-submit");
  expect(submit).toBeDisabled();

  await user.type(screen.getByTestId("card-fund-amount-input"), "25");

  expect(submit).toBeEnabled();
  expect(screen.getByText(/Available:/)).toBeVisible();
});

it("blocks an amount above the source account balance", async () => {
  const { user } = renderFundDialog();

  await user.type(screen.getByTestId("card-fund-amount-input"), "101");

  expect(screen.getByText("This amount exceeds your available balance")).toBeVisible();
  expect(screen.getByTestId("card-fund-submit")).toBeDisabled();
});
