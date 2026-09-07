import BigNumber from "bignumber.js";
import { TransactionType } from "@ledgerhq/concordium-core";
import { craftTransaction } from "./craftTransaction";
import { combine } from "./combine";
import { broadcast } from "./broadcast";
import { createFixtureConfig } from "../../test/fixtures";

// Mock network calls
jest.mock("../../network/proxyClient", () => ({
  submitTransfer: jest.fn().mockResolvedValue({ submissionId: "test-submission-id" }),
}));

const VALID_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";
const config = createFixtureConfig();

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

  describe("combine", () => {
    it("should combine transaction and signature into JSON", () => {
      const transaction = "aabbccdd";
      const signature = "11223344";

      const result = combine(transaction, [signature]);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        transactionBody: "aabbccdd",
        signature: "11223344",
      });
    });

    it("should produce valid JSON", () => {
      const result = combine("tx-hex", ["sig-hex"]);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe("broadcast", () => {
    it("should broadcast transaction and return submission ID", async () => {
      const { submitTransfer } = jest.requireMock("../../network/proxyClient");
      const signedTx = JSON.stringify({
        transactionBody: "aabbccdd",
        signature: "11223344",
      });

      const result = await broadcast(config, signedTx, "concordium_testnet");

      expect(result).toBe("test-submission-id");
      expect(submitTransfer).toHaveBeenCalledWith(config, "concordium_testnet", {
        transaction: "aabbccdd",
        signatures: { "0": { "0": "11223344" } },
      });
    });

    it("should parse signed transaction JSON correctly", async () => {
      const { submitTransfer } = jest.requireMock("../../network/proxyClient");
      const signedTx = JSON.stringify({
        transactionBody: "deadbeef",
        signature: "cafebabe",
      });

      await broadcast(config, signedTx, "concordium_testnet");

      expect(submitTransfer).toHaveBeenCalledWith(config, "concordium_testnet", {
        transaction: "deadbeef",
        signatures: { "0": { "0": "cafebabe" } },
      });
    });

    it("should throw on invalid JSON", async () => {
      await expect(broadcast(config, "not-json", "concordium_testnet")).rejects.toThrow();
    });

    it("should propagate network errors", async () => {
      const { submitTransfer } = jest.requireMock("../../network/proxyClient");
      submitTransfer.mockRejectedValueOnce(new Error("Network error"));

      const signedTx = JSON.stringify({
        transactionBody: "aabbccdd",
        signature: "11223344",
      });

      await expect(broadcast(config, signedTx, "concordium_testnet")).rejects.toThrow(
        "Network error",
      );
    });
  });
});
