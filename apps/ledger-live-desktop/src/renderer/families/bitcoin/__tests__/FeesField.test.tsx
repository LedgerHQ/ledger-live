import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { FeeRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/bitcoin/types";
import { render, screen } from "tests/testSetup";
import { FeesField } from "../FeesField";

// The bridge's updateTransaction merges the patch onto the transaction.
// Mocking it also avoids the Suspense boundary that useAccountBridge (React `use`) requires.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const account = genAccount("bitcoin-fees-field", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  family: "bitcoin",
  amount: new BigNumber(1000),
  recipient: "bc1qrecipient",
  feesStrategy: "custom",
  familySpecificData: { rbf: true, feePerByte: "7" },
  feeParameters: { feePerByte: "3", feeRates: { slow: "1", medium: "3", fast: "5" } },
  ...overrides,
});

const buildStatus = (errors: Record<string, Error> = {}): TransactionStatus => ({
  errors,
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
});

const renderField = (transaction: Transaction, status = buildStatus()) => {
  const onChange = jest.fn();
  return {
    onChange,
    ...render(
      <FeesField account={account} transaction={transaction} status={status} onChange={onChange} />,
    ),
  };
};

describe("bitcoin FeesField", () => {
  it("shows the rate the user set when no preset is selected", () => {
    renderField(buildTransaction());

    expect(screen.getByTestId("currency-textbox")).toHaveValue("7");
  });

  it("shows the rate of the last estimation when a preset is selected", () => {
    renderField(buildTransaction({ feesStrategy: "medium" }));

    expect(screen.getByTestId("currency-textbox")).toHaveValue("3");
  });

  it("shows the rate of the last estimation when the user set none", () => {
    renderField(buildTransaction({ familySpecificData: { rbf: true } }));

    expect(screen.getByTestId("currency-textbox")).toHaveValue("3");
  });

  it("sets a custom fee rate, keeping the other user choices", async () => {
    const transaction = buildTransaction();
    const { user, onChange } = renderField(transaction);

    const input = screen.getByTestId("currency-textbox");
    await user.clear(input);
    await user.type(input, "12");

    expect(onChange).toHaveBeenLastCalledWith({
      ...transaction,
      feesStrategy: "custom",
      familySpecificData: { rbf: true, feePerByte: "12" },
    });
  });

  it("shows the fee rate error once the network rates are known", () => {
    renderField(buildTransaction(), buildStatus({ feePerByte: new FeeRequired() }));

    expect(screen.getByTestId("input-error")).toHaveTextContent("Fees are required");
  });

  it("hides the fee rate error until the network rates are known", () => {
    renderField(
      buildTransaction({ feeParameters: { feePerByte: "3" } }),
      buildStatus({ feePerByte: new FeeRequired() }),
    );

    expect(screen.queryByText("Fees are required")).not.toBeInTheDocument();
  });
});
