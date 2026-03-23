import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

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
      account: {} as any,
      parentAccount: null,
      transaction,
      status: {} as any,
    });

    expect(fields).toHaveLength(4);

    expect(fields[0]).toMatchObject({ label: "Transaction Type", value: "Send ICP" });
    expect(fields[1].label).toBe("Payment (ICP)");
    expect(fields[2].label).toBe("Maximum fee (ICP)");
    expect(fields[3]).toMatchObject({ label: "Memo", value: "42" });
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
      account: {} as any,
      parentAccount: null,
      transaction,
      status: {} as any,
    });

    expect(fields[3]).toMatchObject({ value: "0" });
  });
});
