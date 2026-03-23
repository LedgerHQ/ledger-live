/* eslint-disable @typescript-eslint/consistent-type-assertions */
jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  formatCurrencyUnit: jest.fn().mockReturnValue("0.01 MINA"),
}));

import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import BigNumber from "bignumber.js";
import { createMockAccount, createMockTransaction } from "../test/fixtures";
import type { MinaAccount, TransactionStatus } from "../types/common";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  const account = createMockAccount() as MinaAccount;
  const status: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(10),
    amount: new BigNumber(1000),
    totalSpent: new BigNumber(1010),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return delegation fields for stake transactions", async () => {
    const transaction = createMockTransaction({ txType: "stake" });

    const fields = await getDeviceTransactionConfig({
      account,
      parentAccount: null,
      transaction,
      status,
    });

    expect(fields).toEqual([
      { type: "text", label: "Type", value: "Delegation" },
      { type: "text", label: "Delegator", value: account.freshAddress },
      { type: "text", label: "Delegate", value: transaction.recipient },
      { type: "text", label: "Fee", value: "0.01 MINA" },
    ]);
    expect(formatCurrencyUnit).toHaveBeenCalledWith(
      account.currency.units[0],
      transaction.fees.fee,
      { showCode: true },
    );
  });

  it("should return empty array for non-stake transactions", async () => {
    const transaction = createMockTransaction();

    const fields = await getDeviceTransactionConfig({
      account,
      parentAccount: null,
      transaction,
      status,
    });

    expect(fields).toEqual([]);
    expect(formatCurrencyUnit).not.toHaveBeenCalled();
  });
});
