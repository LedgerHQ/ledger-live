import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Transaction as BitcoinTransaction } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { render, screen } from "tests/testSetup";
import type { StepProps } from "../types";
import StepSummary from "./StepSummary";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: () => ({}),
}));

const UTXO_LAG_WARNING =
  "This transaction may take long to verify and sign because the account has a significant number of coins.";

const account = genAccount("sign-transaction-step-summary-account", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const status: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(100),
  amount: new BigNumber(1000),
  totalSpent: new BigNumber(1100),
};

const bitcoinTransaction = (
  feeParameters?: BitcoinTransaction["feeParameters"],
): BitcoinTransaction => ({
  family: "bitcoin",
  amount: new BigNumber(1000),
  recipient: "bc1qrecipient",
  ...(feeParameters ? { feeParameters } : {}),
});

const selectedInputs = (count: number) =>
  Array.from({ length: count }, (_, vout) => ({
    txid: "txid",
    vout,
    value: "1000",
    address: "bc1qaddress",
  }));

const renderSummary = (transaction: Transaction) =>
  render(
    <StepSummary
      {...({
        account,
        parentAccount: null,
        transaction,
        status,
        transitionTo: jest.fn(),
      } as unknown as StepProps)}
    />,
  );

describe("SignTransaction StepSummary", () => {
  it("warns when the estimation selected many coins", () => {
    renderSummary(bitcoinTransaction({ inputs: selectedInputs(50) }));

    expect(screen.getByText(UTXO_LAG_WARNING)).toBeInTheDocument();
  });

  it.each([
    ["the estimation selected few coins", bitcoinTransaction({ inputs: selectedInputs(2) })],
    ["the estimation lists no coins", bitcoinTransaction({})],
    ["the transaction was not estimated", bitcoinTransaction()],
  ])("does not warn when %s", (_, transaction) => {
    renderSummary(transaction);

    expect(screen.queryByText(UTXO_LAG_WARNING)).not.toBeInTheDocument();
  });
});
