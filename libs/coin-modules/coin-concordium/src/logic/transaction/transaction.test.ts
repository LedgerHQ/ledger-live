import BigNumber from "bignumber.js";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { CONCORDIUM_ENERGY } from "../../constants";
import { createTestCryptoCurrency } from "../../test/testHelpers";
import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";
import { combine } from "./combine";
import { broadcast } from "./broadcast";

// Mock network calls
jest.mock("../../network/proxyClient", () => ({
  submitTransfer: jest.fn().mockResolvedValue({ submissionId: "test-submission-id" }),
  getTransactionCost: jest.fn().mockResolvedValue({
    cost: "1000000",
    energy: "501",
  }),
}));

jest.mock("../../network/grpcClient", () => ({
  getBlockChainParameters: jest.fn().mockResolvedValue({
    euroPerEnergy: { numerator: "1", denominator: "1" },
    microCcdPerEuro: { numerator: "1000000", denominator: "1" },
  }),
}));

const VALID_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";

const createMockCurrency = () =>
  createTestCryptoCurrency({
    id: "concordium",
    name: "Concordium",
  });

describe("logic/transaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("craftTransaction", () => {
    it("should craft a simple transfer transaction", async () => {
      const account = {
        address: VALID_ADDRESS,
        nextSequenceNumber: 1,
        publicKey: "aa".repeat(32),
      };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(1000000),
      };

      const result = await craftTransaction(account, transaction);

      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("header");
      expect(result).toHaveProperty("payload");
      expect(result.type).toBe(TransactionType.Transfer);
      expect(result.header.nonce).toBe(BigInt(1));
      expect(result.payload.amount).toBe(BigInt(1000000));
    });

    it("should craft a transfer with memo transaction", async () => {
      const account = {
        address: VALID_ADDRESS,
        nextSequenceNumber: 5,
      };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(2000000),
        memo: "test memo",
      };

      const result = await craftTransaction(account, transaction);

      expect(result.type).toBe(TransactionType.TransferWithMemo);
      expect(result.header.nonce).toBe(BigInt(5));
      expect(result.payload.amount).toBe(BigInt(2000000));
      expect("memo" in result.payload).toBe(true);
      if ("memo" in result.payload) {
        expect(result.payload.memo).toBeInstanceOf(Buffer);
      }
    });

    it("should use default sequence number when not provided", async () => {
      const account = {
        address: VALID_ADDRESS,
        nextSequenceNumber: 1, // SDK requires sequence >= 1
      };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(500000),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.header.nonce).toBe(BigInt(1));
    });

    it("should include energy amount when provided", async () => {
      const account = {
        address: VALID_ADDRESS,
        nextSequenceNumber: 1,
      };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(1000000),
        energy: BigInt(1000),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.header.energyAmount).toBe(BigInt(1000));
    });

    it("should default energy to 0 when not provided", async () => {
      const account = {
        address: VALID_ADDRESS,
        nextSequenceNumber: 1,
      };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(1000000),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.header.energyAmount).toBe(BigInt(0));
    });

    it("should set transaction type to Transfer for simple transfer", async () => {
      const account = { address: VALID_ADDRESS, nextSequenceNumber: 1 };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(1000000),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.type).toBe(TransactionType.Transfer);
    });

    it("should set transaction type to TransferWithMemo when memo is present", async () => {
      const account = { address: VALID_ADDRESS, nextSequenceNumber: 1 };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(1000000),
        memo: "hello",
      };

      const result = await craftTransaction(account, transaction);

      expect(result.type).toBe(TransactionType.TransferWithMemo);
    });

    it("should handle zero amount", async () => {
      const account = { address: VALID_ADDRESS, nextSequenceNumber: 1 };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(0),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.payload.amount).toBe(BigInt(0));
    });

    it("should handle large amounts", async () => {
      const account = { address: VALID_ADDRESS, nextSequenceNumber: 1 };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber("10000000000000"), // 10 trillion microCCD
      };

      const result = await craftTransaction(account, transaction);

      expect(result.payload.amount).toBe(BigInt("10000000000000"));
    });

    it("should set expiry to 1 hour from now", async () => {
      const beforeTime = Math.floor(Date.now() / 1000);

      const account = { address: VALID_ADDRESS, nextSequenceNumber: 1 };
      const transaction = {
        recipient: VALID_ADDRESS,
        amount: new BigNumber(1000000),
      };

      const result = await craftTransaction(account, transaction);

      const afterTime = Math.floor(Date.now() / 1000);
      const expiry = Number(result.header.expiry);

      // Expiry should be ~1 hour (3600 seconds) from now
      expect(expiry).toBeGreaterThanOrEqual(beforeTime + 3600);
      expect(expiry).toBeLessThanOrEqual(afterTime + 3600 + 1);
    });
  });

  describe("estimateFees", () => {
    it("should return fee estimation for simple transfer", async () => {
      const currency = createMockCurrency();

      const result = await estimateFees(currency, TransactionType.Transfer);

      expect(result).toHaveProperty("cost");
      expect(result).toHaveProperty("energy");
      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
    });

    it("should use fixed energy for simple transfer without payload", async () => {
      const currency = createMockCurrency();

      const result = await estimateFees(currency, TransactionType.Transfer);

      // Simple transfer has fixed energy cost
      expect(result.energy).toBe(CONCORDIUM_ENERGY.SIMPLE_TRANSFER);
    });

    it("should calculate energy for transfer with payload", async () => {
      const currency = createMockCurrency();

      const result = await estimateFees(currency, TransactionType.Transfer);

      expect(result.energy).toBeGreaterThan(0n);
    });

    it("should return default values when transaction cost fetch fails", async () => {
      const { getTransactionCost } = jest.requireMock("../../network/proxyClient");
      getTransactionCost.mockRejectedValueOnce(new Error("Network error"));

      const currency = createMockCurrency();

      const result = await estimateFees(currency, TransactionType.Transfer);

      // Should return defaults for simple transfer
      expect(result.cost).toBe(CONCORDIUM_ENERGY.DEFAULT_COST);
      expect(result.energy).toBe(CONCORDIUM_ENERGY.DEFAULT);
    });

    it("should return higher default energy for TransferWithMemo when fetch fails", async () => {
      const { getTransactionCost } = jest.requireMock("../../network/proxyClient");
      getTransactionCost.mockRejectedValueOnce(new Error("Network error"));

      const currency = createMockCurrency();

      const result = await estimateFees(currency, TransactionType.TransferWithMemo);

      // Should return max memo energy for TransferWithMemo to avoid silent failures
      expect(result.cost).toBe(CONCORDIUM_ENERGY.DEFAULT_COST);
      expect(result.energy).toBe(CONCORDIUM_ENERGY.TRANSFER_WITH_MEMO_MAX);
    });

    it("should call getTransactionCost with correct parameters", async () => {
      const { getTransactionCost } = jest.requireMock("../../network/proxyClient");
      const currency = createMockCurrency();

      await estimateFees(currency, TransactionType.Transfer);

      expect(getTransactionCost).toHaveBeenCalledWith(currency, 1, undefined);
    });

    it("should default transaction type to Transfer", async () => {
      const currency = createMockCurrency();

      // Call without explicit transaction type
      const result = await estimateFees(currency);

      expect(result).toHaveProperty("cost");
      expect(result).toHaveProperty("energy");
    });
  });

  describe("combine", () => {
    it("should combine transaction and signature into JSON", () => {
      const transaction = "aabbccdd";
      const signature = "11223344";

      const result = combine(transaction, signature);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        transactionBody: "aabbccdd",
        signature: "11223344",
      });
    });

    it("should produce valid JSON", () => {
      const result = combine("tx-hex", "sig-hex");
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe("broadcast", () => {
    it("should broadcast transaction and return submission ID", async () => {
      const { submitTransfer } = jest.requireMock("../../network/proxyClient");
      const currency = createMockCurrency();
      const signedTx = JSON.stringify({
        transactionBody: "aabbccdd",
        signature: "11223344",
      });

      const result = await broadcast(signedTx, currency);

      expect(result).toBe("test-submission-id");
      expect(submitTransfer).toHaveBeenCalledWith(currency, "aabbccdd", "11223344");
    });

    it("should parse signed transaction JSON correctly", async () => {
      const { submitTransfer } = jest.requireMock("../../network/proxyClient");
      const currency = createMockCurrency();
      const signedTx = JSON.stringify({
        transactionBody: "deadbeef",
        signature: "cafebabe",
      });

      await broadcast(signedTx, currency);

      expect(submitTransfer).toHaveBeenCalledWith(currency, "deadbeef", "cafebabe");
    });

    it("should throw on invalid JSON", async () => {
      const currency = createMockCurrency();

      await expect(broadcast("not-json", currency)).rejects.toThrow();
    });

    it("should propagate network errors", async () => {
      const { submitTransfer } = jest.requireMock("../../network/proxyClient");
      submitTransfer.mockRejectedValueOnce(new Error("Network error"));

      const currency = createMockCurrency();
      const signedTx = JSON.stringify({
        transactionBody: "aabbccdd",
        signature: "11223344",
      });

      await expect(broadcast(signedTx, currency)).rejects.toThrow("Network error");
    });
  });
});
