import { BigNumber } from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";

describe("transaction", () => {
  const account = createFixtureAccount();

  describe("formatTransaction", () => {
    it("should format a basic transaction", () => {
      const transaction = createFixtureTransaction({
        amount: new BigNumber(500000000),
        recipient: "0x456",
      });

      const formatted = formatTransaction(transaction, account);
      expect(formatted).toBe("\nSEND  0.5 SUI\nTO 0x456");
    });

    it("should format a transaction with useAllAmount", () => {
      const transaction = createFixtureTransaction({ useAllAmount: true, recipient: "0x456" });

      const formatted = formatTransaction(transaction, account);
      expect(formatted).toBe("\nSEND MAX\nTO 0x456");
    });
  });

  describe("fromTransactionRaw", () => {
    it("should convert from raw transaction", () => {
      const rawTransaction = {
        family: "sui" as const,
        mode: "send",
        amount: "500000000",
        recipient: "0x456",
        useAllAmount: false,
        fees: "1000000",
      };

      const transaction = fromTransactionRaw(rawTransaction);
      expect(transaction).toEqual({
        family: "sui",
        mode: "send",
        amount: new BigNumber("500000000"),
        recipient: "0x456",
        useAllAmount: false,
        fees: new BigNumber("1000000"),
        errors: {},
      });
    });
  });

  describe("toTransactionRaw", () => {
    it("should convert to raw transaction", () => {
      const transaction = createFixtureTransaction();

      const rawTransaction = toTransactionRaw(transaction);
      expect(rawTransaction).toEqual({
        family: "sui" as const,
        mode: "send",
        amount: "3000000000",
        recipient: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
        useAllAmount: false,
        fees: "3976000",
      });
    });

    it("should handle null fees", () => {
      const transaction = createFixtureTransaction({ fees: null });

      const rawTransaction = toTransactionRaw(transaction);
      expect(rawTransaction.fees).toBe("");
    });
  });
});
