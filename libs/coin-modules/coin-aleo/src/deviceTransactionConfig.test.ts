import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import { TRANSACTION_TYPE } from "./constants";
import { getMockedAccount } from "./__tests__/fixtures/account.fixture";
import { getMockedTransaction } from "./__tests__/fixtures/transaction.fixture";
import type { TransactionStatus } from "./types";

describe("getDeviceTransactionConfig", () => {
  const mockTransaction = getMockedTransaction();
  const mockAccount = getMockedAccount();
  const mockStatus: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(1000),
    totalSpent: new BigNumber(1000),
  };

  it.each([
    ["Transfer Public", TRANSACTION_TYPE.TRANSFER_PUBLIC],
    ["Transfer Private", TRANSACTION_TYPE.TRANSFER_PRIVATE],
    ["Shield", TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
    ["Unshield", TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
    ["Unknown", "invalidMode"],
  ])("should return method '%s' for mode '%s'", async (expectedMethod, mode) => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: { ...mockTransaction, mode },
      status: mockStatus,
    });

    expect(fields).toContainEqual({ type: "text", label: "Method", value: expectedMethod });
  });

  it("should always include the Amount field", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields).toContainEqual({ type: "amount", label: "Amount" });
  });

  it("should include the Fees field when estimatedFees is non-zero", async () => {
    const status: TransactionStatus = { ...mockStatus, estimatedFees: new BigNumber(100) };
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status,
    });

    expect(fields).toContainEqual({ type: "fees", label: "Fees" });
  });

  it("should not include the fees field when estimatedFees is zero", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields).not.toContainEqual({ type: "fees", label: "Fees" });
  });

  it("should return fields in correct order", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: { ...mockTransaction, mode: TRANSACTION_TYPE.TRANSFER_PUBLIC },
      status: { ...mockStatus, estimatedFees: new BigNumber(100) },
    });

    expect(fields.map(f => f.type)).toEqual(["text", "amount", "fees"]);
  });
});
