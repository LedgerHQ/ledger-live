import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { AccountAddress } from "@ledgerhq/hw-app-concordium/lib/address";
import {
  serializeTransfer,
  serializeTransferWithMemo,
} from "@ledgerhq/hw-app-concordium/lib/serialization";
import { craftRawTransaction } from "./craftRawTransaction";

// Valid Concordium addresses derived from test seeds
const VALID_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";
const DIFFERENT_ADDRESS = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

// 64 hex characters = 32 bytes, standard Ed25519 public key length
const PUBLIC_KEY = "aa".repeat(32);

// Helper to create a valid serialized Transfer transaction
function createSerializedTransfer(sender: string, nonce: bigint): string {
  const tx = {
    type: TransactionType.Transfer,
    header: {
      sender: AccountAddress.fromBase58(sender),
      nonce,
      expiry: 1700000000n,
      energyAmount: 500n,
    },
    payload: {
      toAddress: AccountAddress.fromBase58(VALID_ADDRESS),
      amount: 1000000n,
    },
  };

  return serializeTransfer(tx).toString("hex");
}

// Helper to create a valid serialized TransferWithMemo transaction
function createSerializedTransferWithMemo(sender: string, nonce: bigint): string {
  const tx = {
    type: TransactionType.TransferWithMemo,
    header: {
      sender: AccountAddress.fromBase58(sender),
      nonce,
      expiry: 1700000000n,
      energyAmount: 600n,
    },
    payload: {
      toAddress: AccountAddress.fromBase58(VALID_ADDRESS),
      amount: 1000000n,
      memo: Buffer.from("test memo", "utf-8"),
    },
  };

  return serializeTransferWithMemo(tx).toString("hex");
}

describe("craftRawTransaction", () => {
  describe("successful cases - Transfer", () => {
    it("should parse and re-serialize a Transfer transaction", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(5));

      expect(result).toHaveProperty("nativeTransaction");
      expect(result).toHaveProperty("serializedTransaction");
      expect(typeof result.serializedTransaction).toBe("string");
    });

    it("should update the sequence number", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);
      const newSequence = BigInt(42);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, newSequence);

      expect(result.nativeTransaction.header.nonce).toBe(42n);
    });

    it("should preserve the transaction type", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.type).toBe(TransactionType.Transfer);
    });

    it("should preserve the expiry time", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.header.expiry).toBe(1700000000n);
    });

    it("should preserve the energyAmount", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.header.energyAmount).toBe(500n);
    });

    it("should preserve the payload", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.payload).not.toBeUndefined();
      expect(result.nativeTransaction.payload.amount).toBe(1000000n);
    });

    it("should return hex-encoded serialized transaction", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(typeof result.serializedTransaction).toBe("string");
      expect(result.serializedTransaction).toMatch(/^[0-9a-f]+$/);
    });

    it("should handle large sequence numbers", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);
      const largeSequence = BigInt(999999999);

      const result = await craftRawTransaction(
        serialized,
        VALID_ADDRESS,
        PUBLIC_KEY,
        largeSequence,
      );

      expect(result.nativeTransaction.header.nonce).toBe(999999999n);
    });
  });

  describe("successful cases - TransferWithMemo", () => {
    it("should parse and re-serialize a TransferWithMemo transaction", async () => {
      const serialized = createSerializedTransferWithMemo(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(5));

      expect(result).toHaveProperty("nativeTransaction");
      expect(result).toHaveProperty("serializedTransaction");
      expect(result.nativeTransaction.type).toBe(TransactionType.TransferWithMemo);
    });

    it("should preserve the memo", async () => {
      const serialized = createSerializedTransferWithMemo(VALID_ADDRESS, 1n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect("memo" in result.nativeTransaction.payload).toBe(true);
      if ("memo" in result.nativeTransaction.payload) {
        expect(result.nativeTransaction.payload.memo.toString("utf-8")).toBe("test memo");
      }
    });

    it("should update the sequence number for TransferWithMemo", async () => {
      const serialized = createSerializedTransferWithMemo(VALID_ADDRESS, 1n);
      const newSequence = BigInt(99);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, newSequence);

      expect(result.nativeTransaction.header.nonce).toBe(99n);
    });
  });

  describe("error cases", () => {
    it("should throw error when sender address does not match", async () => {
      const serialized = createSerializedTransfer(DIFFERENT_ADDRESS, 1n);

      await expect(
        craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");

      await expect(
        craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Sender address does not match");
    });

    it("should throw error for invalid sender address format", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 1n);

      await expect(
        craftRawTransaction(serialized, "invalid-address", PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");
    });

    it("should throw error for invalid hex string", async () => {
      await expect(
        craftRawTransaction("not-hex", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");
    });

    it("should throw error for too short transaction", async () => {
      await expect(
        craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");

      await expect(
        craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Transaction buffer too short");
    });

    it("should throw error for empty hex string", async () => {
      await expect(craftRawTransaction("", VALID_ADDRESS, PUBLIC_KEY, BigInt(1))).rejects.toThrow(
        "Failed to craft raw transaction",
      );
    });

    it("should throw error for unsupported transaction type", async () => {
      // Create a buffer with an invalid type byte (99 instead of 3 or 22)
      const validTx = createSerializedTransfer(VALID_ADDRESS, 1n);
      const buffer = Buffer.from(validTx, "hex");
      const TYPE_OFFSET = 32 + 8 + 8 + 4 + 8;
      buffer[TYPE_OFFSET] = 99; // Invalid type

      await expect(
        craftRawTransaction(buffer.toString("hex"), VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");

      await expect(
        craftRawTransaction(buffer.toString("hex"), VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Unsupported transaction type: 99");
    });
  });

  describe("roundtrip serialization", () => {
    it("should produce identical output when re-serialized without changes (Transfer)", async () => {
      const serialized = createSerializedTransfer(VALID_ADDRESS, 42n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, 42n);

      // Should produce identical serialization (same nonce, same everything)
      expect(result.serializedTransaction).toBe(serialized);
    });

    it("should produce identical output when re-serialized without changes (TransferWithMemo)", async () => {
      const serialized = createSerializedTransferWithMemo(VALID_ADDRESS, 99n);

      const result = await craftRawTransaction(serialized, VALID_ADDRESS, PUBLIC_KEY, 99n);

      // Should produce identical serialization (same nonce, same everything)
      expect(result.serializedTransaction).toBe(serialized);
    });

    it("should only change nonce when re-serializing with different sequence", async () => {
      const originalSerialized = createSerializedTransfer(VALID_ADDRESS, 1n);
      const result = await craftRawTransaction(originalSerialized, VALID_ADDRESS, PUBLIC_KEY, 999n);

      // Parse both to compare
      const originalBuffer = Buffer.from(originalSerialized, "hex");
      const newBuffer = Buffer.from(result.serializedTransaction, "hex");

      // Sender should be same (first 32 bytes)
      expect(newBuffer.subarray(0, 32)).toEqual(originalBuffer.subarray(0, 32));

      // Nonce should be different (bytes 32-40)
      expect(newBuffer.subarray(32, 40)).not.toEqual(originalBuffer.subarray(32, 40));

      // energyAmount, payloadSize, expiry should be same
      expect(newBuffer.subarray(40, 48)).toEqual(originalBuffer.subarray(40, 48)); // energyAmount
      expect(newBuffer.subarray(48, 52)).toEqual(originalBuffer.subarray(48, 52)); // payloadSize
      expect(newBuffer.subarray(52, 60)).toEqual(originalBuffer.subarray(52, 60)); // expiry

      // Payload should be same
      expect(newBuffer.subarray(61)).toEqual(originalBuffer.subarray(61));
    });
  });
});
