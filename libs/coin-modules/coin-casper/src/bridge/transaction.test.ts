import { BigNumber } from "bignumber.js";
import transaction, { fromTransactionRaw, formatTransaction } from "./transaction";
import { TransactionRaw } from "../types";
import {
  createMockAccount,
  createMockTransaction,
  TEST_ADDRESSES,
  TEST_TRANSFER_IDS,
} from "../test/fixtures";

describe("transaction", () => {
  // Using the createMockAccount function from fixtures
  const account = createMockAccount({
    id: "casper:0:testAccount",
    balance: new BigNumber(100000000),
    spendableBalance: new BigNumber(100000000),
    blockHeight: 123456,
    freshAddress: "0123456789",
    freshAddressPath: "44'/506'/0'/0/0",
    lastSyncDate: new Date(),
  });

  describe("formatTransaction", () => {
    test("should format a transaction with amount", () => {
      const tx = createMockTransaction({
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        useAllAmount: false,
        amount: new BigNumber(50000000),
        fees: new BigNumber(1000000),
        transferId: "1",
      });

      const result = formatTransaction(tx, account);
      expect(result).toContain("SEND");
      expect(result).toContain("0.05");
      expect(result).toContain("CSPR");
      expect(result).toContain(`TO ${TEST_ADDRESSES.RECIPIENT_SECP256K1}`);
    });

    test("should format a transaction with useAllAmount", () => {
      const tx = createMockTransaction({
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        useAllAmount: true,
        amount: new BigNumber(0),
        fees: new BigNumber(1000000),
        transferId: "1",
      });

      const result = formatTransaction(tx, account);
      expect(result).toContain("SEND MAX");
      expect(result).toContain(`TO ${TEST_ADDRESSES.RECIPIENT_SECP256K1}`);
    });

    test("should format a transaction with zero amount", () => {
      const tx = createMockTransaction({
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        useAllAmount: false,
        amount: new BigNumber(0),
        fees: new BigNumber(1000000),
        transferId: "1",
      });

      const result = formatTransaction(tx, account);
      expect(result).toContain("SEND");
      expect(result).not.toContain("MAX");
      expect(result).not.toContain("CSPR");
      expect(result).toContain(`TO ${TEST_ADDRESSES.RECIPIENT_SECP256K1}`);
    });

    test("should format a transaction with different address formats", () => {
      // Test with ED25519 address format
      const tx = createMockTransaction({
        recipient: TEST_ADDRESSES.RECIPIENT_ED25519,
        amount: new BigNumber(50000000),
      });

      const result = formatTransaction(tx, account);
      expect(result).toContain(`TO ${TEST_ADDRESSES.RECIPIENT_ED25519}`);
    });

    test("should format a transaction with transfer ID", () => {
      const tx = createMockTransaction({
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        amount: new BigNumber(50000000),
        transferId: TEST_TRANSFER_IDS.VALID,
      });

      const result = formatTransaction(tx, account);
      expect(result).toContain("0.05");
      expect(result).toContain("CSPR");
      expect(result).toContain(`TO ${TEST_ADDRESSES.RECIPIENT_SECP256K1}`);
    });
  });

  describe("fromTransactionRaw", () => {
    test("should convert a transaction raw to a transaction", () => {
      const raw: TransactionRaw = {
        family: "casper",
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        useAllAmount: false,
        amount: "50000000",
        fees: "1000000",
        transferId: TEST_TRANSFER_IDS.VALID,
      };

      const result = fromTransactionRaw(raw);
      expect(result.family).toBe("casper");
      expect(result.recipient).toBe(TEST_ADDRESSES.RECIPIENT_SECP256K1);
      expect(result.useAllAmount).toBe(false);
      expect(result.amount).toEqual(new BigNumber(50000000));
      expect(result.fees).toEqual(new BigNumber(1000000));
      expect(result.transferId).toBe(TEST_TRANSFER_IDS.VALID);
    });

    test("should handle transaction raw without optional fields", () => {
      const raw: TransactionRaw = {
        family: "casper",
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        useAllAmount: false,
        amount: "50000000",
        fees: "1000000",
      };

      const result = fromTransactionRaw(raw);
      expect(result.family).toBe("casper");
      expect(result.transferId).toBeUndefined();
    });
  });

  describe("toTransactionRaw", () => {
    test("should convert a transaction to a transaction raw", () => {
      const tx = createMockTransaction({
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        useAllAmount: false,
        amount: new BigNumber(50000000),
        fees: new BigNumber(1000000),
        transferId: TEST_TRANSFER_IDS.VALID,
      });

      const result = transaction.toTransactionRaw(tx);
      expect(result.family).toBe("casper");
      expect(result.recipient).toBe(TEST_ADDRESSES.RECIPIENT_SECP256K1);
      expect(result.useAllAmount).toBe(false);
      expect(result.amount).toBe("50000000");
      expect(result.fees).toBe("1000000");
      expect(result.transferId).toBe(TEST_TRANSFER_IDS.VALID);
    });

    test("should handle transaction without optional fields", () => {
      const tx = createMockTransaction({
        recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
        useAllAmount: false,
        amount: new BigNumber(50000000),
        fees: new BigNumber(1000000),
        transferId: undefined,
      });

      const result = transaction.toTransactionRaw(tx);
      expect(result.transferId).toBeUndefined();
    });

    test("should handle different transaction scenarios", () => {
      // Test with useAllAmount = true
      const maxTx = createMockTransaction({
        useAllAmount: true,
        amount: new BigNumber(0),
      });

      const maxResult = transaction.toTransactionRaw(maxTx);
      expect(maxResult.useAllAmount).toBe(true);
      expect(maxResult.amount).toBe("0");

      // Test with very large amount
      const largeTx = createMockTransaction({
        amount: new BigNumber("9999000000000"), // 9,999 CSPR
      });

      const largeResult = transaction.toTransactionRaw(largeTx);
      expect(largeResult.amount).toBe("9999000000000");
    });
  });
});
