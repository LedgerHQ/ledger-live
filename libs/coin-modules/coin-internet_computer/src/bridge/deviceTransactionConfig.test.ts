import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import { Transaction, TransactionStatus } from "../types";

describe("getDeviceTransactionConfig", () => {
  it("should return fields for transaction type, payment, fee, and memo", async () => {
    const transaction: Transaction = {
      family: "internet_computer",
      amount: new BigNumber(100000000),
      fees: new BigNumber(10000),
      recipient: "recipient",
      useAllAmount: false,
      memo: "42",
    };

    const fields = await getDeviceTransactionConfig({
      account: {} as Account,
      parentAccount: null,
      transaction,
      status: {} as TransactionStatus,
    });

    expect(fields).toHaveLength(4);

    expect(fields[0].label).toBe("Transaction Type");
    expect(fields[0].value).toBe("Send ICP");

    expect(fields[1].label).toBe("Payment (ICP)");

    expect(fields[2].label).toBe("Maximum fee (ICP)");

    expect(fields[3].label).toBe("Memo");
    expect(fields[3].value).toBe("42");
  });

  it("should use '0' as default memo when memo is undefined", async () => {
    const transaction: Transaction = {
      family: "internet_computer",
      amount: new BigNumber(0),
      fees: new BigNumber(10000),
      recipient: "recipient",
      useAllAmount: false,
    };

    const fields = await getDeviceTransactionConfig({
      account: {} as Account,
      parentAccount: null,
      transaction,
      status: {} as TransactionStatus,
    });

    expect(fields[3].value).toBe("0");
  });
});
