import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

const account = {
  id: "js:2:internet_computer:test:",
  freshAddress: "senderaddress",
  freshAddressPath: "44'/223'/0'/0/0",
} as any;

const tx = (over: Partial<Transaction>): Transaction =>
  ({
    family: "internet_computer",
    amount: new BigNumber(200_000_000),
    fees: new BigNumber(10_000),
    recipient: "recipient",
    ...over,
  }) as Transaction;

describe("buildOptimisticOperation", () => {
  it("carries the fee and amount+fee value for a ledger transfer", async () => {
    const op = await buildOptimisticOperation(account, tx({ type: "send" }), "hash", "OUT");
    expect(op.fee.toString()).toBe("10000");
    expect(op.value.toString()).toBe("200010000");
  });

  it("zeroes fee and value for a governance op (no ledger debit)", async () => {
    const op = await buildOptimisticOperation(
      account,
      tx({ type: "start_dissolving" }),
      "hash",
      "NONE",
    );
    expect(op.fee.toString()).toBe("0");
    expect(op.value.toString()).toBe("0");
    expect(op.type).toBe("NONE");
  });
});
