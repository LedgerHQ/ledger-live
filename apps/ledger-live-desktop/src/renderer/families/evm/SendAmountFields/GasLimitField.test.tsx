import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { DEFAULT_GAS_LIMIT } from "@ledgerhq/coin-evm/logic-public";
import { render, screen, fireEvent } from "tests/testSetup";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/evm/types";
import GasLimitField from "./GasLimitField";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) =>
      Object.assign({}, tx, patch),
  }),
}));

const account = genAccount("evm-test", { currency: getCryptoCurrencyById("ethereum") });

const transaction: Transaction = {
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  mode: "send",
  family: "evm",
  gasPrice: undefined,
  maxFeePerGas: new BigNumber("28026227316"),
  maxPriorityFeePerGas: new BigNumber("1000000000"),
  customGasLimit: undefined,
  nonce: 0,
  gasLimit: new BigNumber("21000"),
  chainId: 1,
  type: 2,
};

const status: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
  totalFees: new BigNumber(0),
};

const typeGasLimit = (value: string) => {
  const updateTransaction = jest.fn();
  render(
    <GasLimitField
      account={account}
      parentAccount={null}
      transaction={transaction}
      status={status}
      onChange={jest.fn()}
      updateTransaction={updateTransaction}
    />,
  );
  fireEvent.click(screen.getByRole("button"));
  fireEvent.change(screen.getByRole("textbox"), { target: { value } });
  const [updater] = updateTransaction.mock.calls[0];
  return updater(transaction).customGasLimit;
};

describe("EVM GasLimitField", () => {
  it.each([
    ["50000", new BigNumber(50000)],
    ["0x5208", new BigNumber(21000)],
  ])("uses the typed gas limit %p", (value, expected) => {
    expect(typeGasLimit(value)).toEqual(expected);
  });

  it.each(["abc", "Infinity", "-5", "21000.5"])(
    "falls back to the default gas limit for %p",
    value => {
      expect(typeGasLimit(value)).toEqual(DEFAULT_GAS_LIMIT);
    },
  );
});
