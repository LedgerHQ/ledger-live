import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { MAX_MEMO_SIZE } from "../constants";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

const mockAccount = {
  currency: {
    name: "Concordium",
    units: [{ code: "CCD", magnitude: 6 }],
  },
  freshAddress: "4ghi5jkl6mno7pqr8stu9vwx0yz1abc2def3",
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
} as Account;

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "concordium",
    amount: new BigNumber(100),
    recipient: "3abc1def2ghi4jkl5mno6pqr7stu8vwx9yz0",
    fee: new BigNumber(10),
    ...overrides,
  }) as Transaction;

describe("getTransactionStatus - memo validation", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "testnet",
      grpcUrl: "https://grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
      currency: mockAccount.currency,
    }));
  });

  describe("valid memos", () => {
    it.each([
      ["undefined", undefined],
      ["empty string", ""],
      ["simple text", "Payment for invoice"],
      ["unicode characters", "Hello 世界 🌍"],
    ])("should accept %s memo", async (_description, memo) => {
      const transaction = createTransaction({ memo });
      const result = await getTransactionStatus(mockAccount, transaction);
      expect(result.errors.memo).toBeUndefined();
    });
  });

  describe("protocol boundaries (254 bytes)", () => {
    it.each([
      ["ASCII at limit", "a".repeat(MAX_MEMO_SIZE), 254],
      ["multi-byte at limit", "🌍".repeat(63) + "12", 254],
    ])("should accept %s (%s bytes)", async (_description, memo, expectedBytes) => {
      expect(Buffer.from(memo, "utf-8").length).toBe(expectedBytes);
      const transaction = createTransaction({ memo });
      const result = await getTransactionStatus(mockAccount, transaction);
      expect(result.errors.memo).toBeUndefined();
    });

    it.each([
      ["ASCII over limit", "a".repeat(MAX_MEMO_SIZE + 1), 255],
      ["multi-byte over limit", "🌍".repeat(64), 256],
    ])("should reject %s (%s bytes)", async (_description, memo, expectedBytes) => {
      expect(Buffer.from(memo, "utf-8").length).toBe(expectedBytes);
      const transaction = createTransaction({ memo });
      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.memo).not.toBeUndefined();
      expect(result.errors.memo?.message).toContain("Memo too long");
      expect(result.errors.memo?.message).toContain("254");
    });
  });
});
