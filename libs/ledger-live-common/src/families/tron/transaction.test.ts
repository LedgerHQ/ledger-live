import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";

const rawBase = {
  family: "tron",
  mode: "send",
  amount: "1000000",
  recipient: "TVqLYbpUXv5Q4j7krFr3duqf2GUZghDfQy",
  useAllAmount: false,
} as unknown as TransactionRaw;

describe("tron transaction serialization", () => {
  it("revives the fee as a BigNumber and leaves it null when absent", () => {
    expect(fromTransactionRaw({ ...rawBase, fees: "270000" }).fees).toEqual(new BigNumber(270_000));
    expect(fromTransactionRaw(rawBase).fees).toBeNull();
  });

  it("round-trips the chain-specific staking fields", () => {
    const familySpecificData = {
      resource: "BANDWIDTH" as const,
      duration: 3,
      votes: [{ name: "sr", address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH", voteCount: 7 }],
    };

    const transaction = fromTransactionRaw({
      ...rawBase,
      mode: "freeze",
      familySpecificData,
    } as unknown as TransactionRaw);

    expect(transaction.familySpecificData).toEqual(familySpecificData);
    // The bag is JSON-serializable by contract, so serializing must not alter it.
    expect(toTransactionRaw(transaction).familySpecificData).toEqual(familySpecificData);
  });

  it("leaves familySpecificData absent for a plain send", () => {
    const transaction = fromTransactionRaw(rawBase);

    expect(transaction.familySpecificData).toBeUndefined();
    expect(toTransactionRaw(transaction).familySpecificData).toBeUndefined();
  });

  it("serializes the fee back to a string", () => {
    const transaction = {
      ...fromTransactionRaw(rawBase),
      fees: new BigNumber(270_000),
    } as Transaction;

    expect(toTransactionRaw(transaction).fees).toBe("270000");
  });
});
