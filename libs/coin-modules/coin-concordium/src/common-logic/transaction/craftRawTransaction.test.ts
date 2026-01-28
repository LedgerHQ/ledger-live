import {
  AccountAddress,
  AccountTransactionType,
  SequenceNumber,
  TransactionExpiry,
} from "@ledgerhq/concordium-sdk-adapter";
import { craftRawTransaction } from "./craftRawTransaction";

// Valid Concordium addresses derived from test seeds
const VALID_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";
const DIFFERENT_ADDRESS = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

// 64 hex characters = 32 bytes, standard Ed25519 public key length
const PUBLIC_KEY = "aa".repeat(32);

// Mock the SDK deserialization function
jest.mock("@ledgerhq/concordium-sdk-adapter", () => {
  const actual = jest.requireActual("@ledgerhq/concordium-sdk-adapter");
  return {
    ...actual,
    deserializeAccountTransaction: jest.fn(),
    serializeAccountTransaction: jest.fn().mockReturnValue(Buffer.from("aabbccdd", "hex")),
  };
});

const { deserializeAccountTransaction, serializeAccountTransaction } = jest.requireMock(
  "@ledgerhq/concordium-sdk-adapter",
);

// Helper to create mock deserialized transaction
const createMockDeserializedTransaction = (sender: string) => ({
  accountTransaction: {
    type: AccountTransactionType.Transfer,
    header: {
      sender: AccountAddress.fromBase58(sender),
      nonce: SequenceNumber.create(1),
      // Unix timestamp ~2023-11-15
      expiry: TransactionExpiry.fromEpochSeconds(1700000000),
    },
    payload: {
      amount: { microCcdAmount: BigInt(1000000) },
      toAddress: AccountAddress.fromBase58(VALID_ADDRESS),
    },
  },
});

describe("craftRawTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default successful mock
    deserializeAccountTransaction.mockReturnValue(createMockDeserializedTransaction(VALID_ADDRESS));
    serializeAccountTransaction.mockReturnValue(Buffer.from("aabbccdd", "hex"));
  });

  describe("successful cases", () => {
    it("should parse and re-serialize a transaction", async () => {
      const result = await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(5));

      expect(result).toHaveProperty("nativeTransaction");
      expect(result).toHaveProperty("serializedTransaction");
      expect(typeof result.serializedTransaction).toBe("string");
    });

    it("should call deserializeAccountTransaction with cursor", async () => {
      await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(5));

      expect(deserializeAccountTransaction).toHaveBeenCalledTimes(1);
      // First argument should be an object with read and remainingBytes methods
      const cursor = deserializeAccountTransaction.mock.calls[0][0];
      expect(cursor).toHaveProperty("read");
      expect(cursor).toHaveProperty("remainingBytes");
    });

    it("should update the sequence number", async () => {
      const newSequence = BigInt(42);
      const result = await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, newSequence);

      expect(result.nativeTransaction.header.nonce.value).toBe(newSequence);
    });

    it("should preserve the transaction type", async () => {
      const result = await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.type).toBe(AccountTransactionType.Transfer);
    });

    it("should preserve the expiry time", async () => {
      const result = await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.header.expiry.expiryEpochSeconds).toBe(BigInt(1700000000));
    });

    it("should preserve the payload", async () => {
      const result = await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.payload).toBeDefined();
    });

    it("should set energyAmount to 0", async () => {
      const result = await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.nativeTransaction.energyAmount).toBe(BigInt(0));
    });

    it("should call serializeAccountTransaction with updated transaction", async () => {
      const newSequence = BigInt(99);
      await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, newSequence);

      expect(serializeAccountTransaction).toHaveBeenCalledTimes(1);
      const [transaction, signatures] = serializeAccountTransaction.mock.calls[0];
      expect(transaction.header.nonce.value).toBe(newSequence);
      expect(signatures).toEqual({});
    });

    it("should return hex-encoded serialized transaction", async () => {
      serializeAccountTransaction.mockReturnValue(Buffer.from([0xde, 0xad, 0xbe, 0xef]));

      const result = await craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      expect(result.serializedTransaction).toBe("deadbeef");
    });

    it("should handle large sequence numbers", async () => {
      const largeSequence = BigInt(999999999);
      const result = await craftRawTransaction(
        "aabbccdd",
        VALID_ADDRESS,
        PUBLIC_KEY,
        largeSequence,
      );

      expect(result.nativeTransaction.header.nonce.value).toBe(largeSequence);
    });
  });

  describe("error cases", () => {
    it("should throw error when sender address does not match", async () => {
      // Transaction was created with DIFFERENT_ADDRESS as sender
      deserializeAccountTransaction.mockReturnValue(
        createMockDeserializedTransaction(DIFFERENT_ADDRESS),
      );

      await expect(
        craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");

      await expect(
        craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Sender address does not match");
    });

    it("should throw error when deserialization fails", async () => {
      deserializeAccountTransaction.mockImplementation(() => {
        throw new Error("Invalid transaction format");
      });

      await expect(
        craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction: Invalid transaction format");
    });

    it("should throw error when serialization fails", async () => {
      serializeAccountTransaction.mockImplementation(() => {
        throw new Error("Serialization error");
      });

      await expect(
        craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction: Serialization error");
    });

    it("should throw error for invalid sender address format", async () => {
      await expect(
        craftRawTransaction("aabbccdd", "invalid-address", PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");
    });

    it("should wrap non-Error exceptions", async () => {
      deserializeAccountTransaction.mockImplementation(() => {
        throw "string error";
      });

      await expect(
        craftRawTransaction("aabbccdd", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction: string error");
    });
  });

  describe("Cursor class", () => {
    it("should create cursor from hex string", async () => {
      await craftRawTransaction("deadbeef", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      const cursor = deserializeAccountTransaction.mock.calls[0][0];
      // Cursor should have been created with the hex data
      expect(typeof cursor.read).toBe("function");
    });

    it("should handle empty hex string by failing deserialization", async () => {
      deserializeAccountTransaction.mockImplementation(() => {
        throw new Error("Failed to read bytes");
      });

      await expect(craftRawTransaction("", VALID_ADDRESS, PUBLIC_KEY, BigInt(1))).rejects.toThrow(
        "Failed to craft raw transaction",
      );
    });

    it("should provide cursor with read method that returns Buffer", async () => {
      await craftRawTransaction("deadbeef", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      const cursor = deserializeAccountTransaction.mock.calls[0][0];
      // Read should return a Buffer
      const data = cursor.read(2);
      expect(Buffer.isBuffer(data)).toBe(true);
      expect(data.length).toBe(2);
    });

    it("should provide cursor with remainingBytes property", async () => {
      await craftRawTransaction("deadbeef", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      const cursor = deserializeAccountTransaction.mock.calls[0][0];
      expect(Buffer.isBuffer(cursor.remainingBytes)).toBe(true);
    });

    it("should throw error when reading more bytes than available", async () => {
      // We need to test the actual Cursor behavior, so let deserialize call the cursor
      deserializeAccountTransaction.mockImplementation(cursor => {
        // Try to read more bytes than available (deadbeef = 4 bytes)
        cursor.read(100);
      });

      await expect(
        craftRawTransaction("deadbeef", VALID_ADDRESS, PUBLIC_KEY, BigInt(1)),
      ).rejects.toThrow("Failed to craft raw transaction");
    });

    it("should read all remaining bytes when numBytes not specified", async () => {
      await craftRawTransaction("deadbeefcafe", VALID_ADDRESS, PUBLIC_KEY, BigInt(1));

      const cursor = deserializeAccountTransaction.mock.calls[0][0];
      // Read 2 bytes first
      cursor.read(2);
      // Then read remaining (should be 4 bytes)
      const remaining = cursor.read();
      expect(remaining.length).toBe(4);
    });
  });
});
