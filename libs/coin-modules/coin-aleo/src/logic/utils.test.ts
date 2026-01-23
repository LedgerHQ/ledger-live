import BigNumber from "bignumber.js";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { Transaction } from "../types";
import {
  calculateAmount,
  parseMicrocredits,
  patchAccountWithViewKey,
  determineTransactionType,
  generateUniqueUsername,
} from "./utils";

describe("logic utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseMicrocredits", () => {
    it("should parse valid microcredits string and remove u64 suffix", () => {
      const result = parseMicrocredits("1000000u64");

      expect(result).toBe("1000000");
    });

    it("should parse valid private microcredits string and remove u64.private suffix", () => {
      const result = parseMicrocredits("1000000u64.private");

      expect(result).toBe("1000000");
    });

    it("should parse zero microcredits", () => {
      const result = parseMicrocredits("0u64");

      expect(result).toBe("0");
    });

    it("should parse zero private microcredits", () => {
      const result = parseMicrocredits("0u64.private");

      expect(result).toBe("0");
    });

    it("should parse large microcredits values", () => {
      const result = parseMicrocredits("999999999999999u64");

      expect(result).toBe("999999999999999");
    });

    it("should parse large private microcredits values", () => {
      const result = parseMicrocredits("999999999999999u64.private");

      expect(result).toBe("999999999999999");
    });

    it("should throw error when u64 or u64.private suffix is missing", () => {
      const value = "1000000";
      expect(() => parseMicrocredits(value)).toThrow(
        `aleo: invalid microcredits format (${value})`,
      );
    });

    it("should throw error for invalid format", () => {
      const value = "1000000u32";
      expect(() => parseMicrocredits(value)).toThrow(
        `aleo: invalid microcredits format (${value})`,
      );
    });

    it("should throw error for invalid private format", () => {
      const value = "1000000u32.private";
      expect(() => parseMicrocredits(value)).toThrow(
        `aleo: invalid microcredits format (${value})`,
      );
    });
  });

  describe("patchAccountWithViewKey", () => {
    it("should encode viewKey in account id", () => {
      const mockViewKey = "AViewKey1mockviewkey";
      const mockAccount = getMockedAccount({
        id: "js:2:aleo:aleo1test:",
        operations: [],
      });

      const result = patchAccountWithViewKey(mockAccount, mockViewKey);

      expect(result.id).not.toBe(mockAccount.id);
      expect(result.id).toBe(`js:2:aleo:aleo1test::${mockViewKey}`);
    });

    it("should update operation ids with new account id", () => {
      const mockViewKey = "AViewKey1mockviewkey";
      const mockOp1 = getMockedOperation({
        id: "js:2:aleo:aleo1test:-op1-OUT",
        accountId: "js:2:aleo:aleo1test:",
        hash: "op1",
        type: "OUT",
      });

      const mockOp2 = getMockedOperation({
        id: "js:2:aleo:aleo1test:-op2-IN",
        accountId: "js:2:aleo:aleo1test:",
        hash: "op2",
        type: "IN",
      });

      const mockAccount = getMockedAccount({
        id: "js:2:aleo:aleo1test:",
        operations: [mockOp1, mockOp2],
      });

      const result = patchAccountWithViewKey(mockAccount, mockViewKey);

      expect(result.operations).toEqual([
        expect.objectContaining({
          id: `js:2:aleo:aleo1test::${mockViewKey}-op1-OUT`,
          accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
        }),
        expect.objectContaining({
          id: `js:2:aleo:aleo1test::${mockViewKey}-op2-IN`,
          accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
        }),
      ]);
    });
  });

  describe("determineTransactionType", () => {
    it("should return private for transfer_private regardless of operation type", () => {
      expect(determineTransactionType("transfer_private", "IN")).toBe("private");
      expect(determineTransactionType("transfer_private", "OUT")).toBe("private");
      expect(determineTransactionType("transfer_private", "NONE")).toBe("private");
    });

    it("should return public for transfer_public regardless of operation type", () => {
      expect(determineTransactionType("transfer_public", "IN")).toBe("public");
      expect(determineTransactionType("transfer_public", "OUT")).toBe("public");
      expect(determineTransactionType("transfer_public", "NONE")).toBe("public");
    });

    it("should return private for IN operations ending with to_private", () => {
      expect(determineTransactionType("transfer_public_to_private", "IN")).toBe("private");
    });

    it("should return public for IN operations ending with to_public", () => {
      expect(determineTransactionType("transfer_private_to_public", "IN")).toBe("public");
    });

    it("should return private for OUT operations starting with transfer_private", () => {
      expect(determineTransactionType("transfer_private_to_public", "OUT")).toBe("private");
    });

    it("should return public for OUT operations starting with transfer_public", () => {
      expect(determineTransactionType("transfer_public_to_private", "OUT")).toBe("public");
    });

    it("should return fallback for unrecognized function ids", () => {
      expect(determineTransactionType("unknown_function", "IN")).toBe("public");
      expect(determineTransactionType("unknown_function", "OUT")).toBe("public");
    });

    it("should return fallback for NONE operations with cross-balance transfers", () => {
      expect(determineTransactionType("transfer_public_to_private", "NONE")).toBe("public");
      expect(determineTransactionType("transfer_private_to_public", "NONE")).toBe("public");
    });
  });

  describe("generateUniqueUsername", () => {
    it("should generate a SHA-256 hash from timestamp and address", () => {
      const mockAddress = "aleo1test123";
      const result = generateUniqueUsername(mockAddress);

      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate unique hashes for different addresses", () => {
      const address1 = "aleo1address1";
      const address2 = "aleo1address2";

      const result1 = generateUniqueUsername(address1);
      const result2 = generateUniqueUsername(address2);

      expect(result1).toHaveLength(64);
      expect(result2).toHaveLength(64);
      expect(result1).toMatch(/^[a-f0-9]{64}$/);
      expect(result2).toMatch(/^[a-f0-9]{64}$/);
      expect(result1).not.toBe(result2);
    });
  });

  describe("calculateAmount", () => {
    it("should return transaction amount when useAllAmount is false", () => {
      const estimatedFees = new BigNumber(5000);
      const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
      const mockTransaction = {
        amount: new BigNumber(500000),
        useAllAmount: false,
      } as Transaction;

      const result = calculateAmount({
        account: mockAccount,
        transaction: mockTransaction,
        estimatedFees,
      });

      expect(result).toMatchObject({
        amount: mockTransaction.amount,
        totalSpent: mockTransaction.amount.plus(estimatedFees),
      });
    });

    it("should calculate max amount when useAllAmount is true", () => {
      const estimatedFees = new BigNumber(5000);
      const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
      const mockTransaction = {
        amount: new BigNumber(0),
        useAllAmount: true,
      } as Transaction;

      const result = calculateAmount({
        account: mockAccount,
        transaction: mockTransaction,
        estimatedFees,
      });

      expect(result).toMatchObject({
        amount: mockAccount.balance.minus(estimatedFees),
        totalSpent: mockAccount.balance,
      });
    });

    it("should return zero amount when balance is less than fees with useAllAmount", () => {
      const estimatedFees = new BigNumber(5000);
      const mockAccount = getMockedAccount({ balance: new BigNumber(3000) });
      const mockTransaction = {
        amount: new BigNumber(0),
        useAllAmount: true,
      } as Transaction;

      const result = calculateAmount({
        account: mockAccount,
        transaction: mockTransaction,
        estimatedFees,
      });

      expect(result).toMatchObject({
        amount: new BigNumber(0),
        totalSpent: estimatedFees,
      });
    });
  });
});
