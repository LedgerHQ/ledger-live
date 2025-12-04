import BigNumber from "bignumber.js";
import { createMockCantonAccount, createMockTransaction } from "../test/fixtures";
import type { TransactionStatus } from "../types";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  const mockAccount = createMockCantonAccount();
  const mockTransaction = createMockTransaction();

  it("should return amount field when it's more than 0", async () => {
    const status: TransactionStatus = {
      errors: {},
      warnings: {},
      amount: new BigNumber(1),
      estimatedFees: new BigNumber(0),
      totalSpent: new BigNumber(1),
    };

    expect(
      (
        await getDeviceTransactionConfig({
          account: mockAccount,
          parentAccount: null,
          transaction: mockTransaction,
          status,
        })
      )[0],
    ).toEqual({ type: "amount", label: "Amount" });
  });

  it("should return fee field when it's more than 0", async () => {
    const status: TransactionStatus = {
      errors: {},
      warnings: {},
      amount: new BigNumber(0),
      estimatedFees: new BigNumber(1),
      totalSpent: new BigNumber(1),
    };

    expect(
      (
        await getDeviceTransactionConfig({
          account: mockAccount,
          parentAccount: null,
          transaction: mockTransaction,
          status,
        })
      )[0],
    ).toEqual({ type: "fees", label: "Fees" });
  });
});
