import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { act, render, screen } from "tests/testSetup";
import CardTopUpRoot, { openCardTopUp } from "../screens/CardTopUp/CardTopUpDialog";

jest.mock("../hooks/useCardTopUpMaxAmount", () => ({
  useCardTopUpMaxAmount: () => new BigNumber(80_000_000),
}));

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

function renderTopUpDialog() {
  const rendered = render(<CardTopUpRoot />, {
    initialState: { accounts: [parentAccount] },
  });

  act(() => {
    openCardTopUp({ account: sourceAccount, parentAccount, asset });
  });

  return rendered;
}

it("opens on the linked asset", () => {
  renderTopUpDialog();

  expect(screen.getByRole("dialog", { name: "Top up USDC" })).toBeVisible();
  expect(screen.getByTestId("card-top-up-submit")).toBeDisabled();
});

it("enables the review after a valid amount is entered", async () => {
  const { user } = renderTopUpDialog();

  await user.type(screen.getByTestId("card-top-up-amount-input"), "25");

  expect(screen.getByTestId("card-top-up-submit")).toBeEnabled();
});

it("blocks an amount above what the account can send", async () => {
  const { user } = renderTopUpDialog();

  await user.type(screen.getByTestId("card-top-up-amount-input"), "90");

  expect(screen.getByText("This amount exceeds your available balance")).toBeVisible();
  expect(screen.getByTestId("card-top-up-submit")).toBeDisabled();
});

it("fills the maximum the account can send", async () => {
  const { user } = renderTopUpDialog();

  await user.click(screen.getByTestId("card-top-up-ratio-max"));

  expect(screen.getByTestId("card-top-up-amount-input")).toHaveValue("80");
  expect(screen.getByTestId("card-top-up-submit")).toBeEnabled();
});
