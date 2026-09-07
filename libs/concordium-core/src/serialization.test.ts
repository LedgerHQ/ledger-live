import {
  serializeCredentialDeploymentValues,
  serializeTransfer,
  serializeTransferWithMemo,
  deserializeTransfer,
  deserializeTransferWithMemo,
  deserializeTransaction,
  serializeTransaction,
  getTransactionType,
  insertAccountOwnershipProofs,
  serializeTokenUpdate,
  deserializeTokenUpdate,
  isTokenUpdateTransaction,
} from "./serialization";
import { encodePltTransferOperations } from "./plt";
import { AccountAddress } from "./address";
import { TransactionType } from "./types";
import type {
  CredentialDeploymentTransaction,
  TokenUpdateTransaction,
  Transaction,
  TransferWithMemoPayload,
} from "./types";

describe("serialization", () => {
  describe("serializeCredentialDeploymentValues", () => {
    it("should serialize minimal credential deployment transaction", () => {
      // GIVEN
      const transaction: CredentialDeploymentTransaction = {
        credentialPublicKeys: {
          keys: {
            "0": {
              schemeId: "Ed25519",
              verifyKey: "a".repeat(64),
            },
          },
          threshold: 1,
        },
        credId: "b".repeat(96),
        ipIdentity: 0,
        revocationThreshold: 2,
        arData: {
          "1": {
            encIdCredPubShare: "cc".repeat(96),
          },
        },
        policy: {
          validTo: "202612",
          createdAt: "202512",
          revealedAttributes: {},
        },
        proofs: {
          sig: "d".repeat(128),
          commitments: "e".repeat(96),
          challenge: "f".repeat(64),
          proofIdCredPub: {},
          proofIpSig: "11".repeat(64),
          proofRegId: "22".repeat(64),
          credCounterLessThanMaxAccounts: "33".repeat(64),
        },
        expiry: 1000000n,
      };

      // WHEN
      const result = serializeCredentialDeploymentValues(transaction);

      // THEN
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      let offset = 0;

      // Verify credential public keys count
      expect(result[offset]).toBe(1); // Number of keys
      offset += 1;

      // Verify first key (index 0, scheme Ed25519, verifyKey)
      expect(result[offset]).toBe(0); // Key index
      offset += 1;
      expect(result[offset]).toBe(0); // Ed25519 scheme
      offset += 1;
      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("a".repeat(64));
      offset += 32;

      // Verify threshold
      expect(result[offset]).toBe(1);
      offset += 1;

      // Verify credId (48 bytes)
      expect(result.subarray(offset, offset + 48).toString("hex")).toBe("b".repeat(96));
      offset += 48;

      // Verify ipIdentity (4 bytes, u32)
      expect(result.readUInt32BE(offset)).toBe(0);
      offset += 4;

      // Verify revocationThreshold (1 byte, u8)
      expect(result[offset]).toBe(2);
      offset += 1;

      // Verify arData count (2 bytes, u16)
      expect(result.readUInt16BE(offset)).toBe(1);
      offset += 2;

      // Verify arData entry: AR identity 1 (4 bytes, u32) + encIdCredPubShare (96 bytes)
      expect(result.readUInt32BE(offset)).toBe(1);
      offset += 4;
      expect(result.subarray(offset, offset + 96).toString("hex")).toBe("cc".repeat(96));
      offset += 96;

      // Verify validTo (3 bytes: 2026 year + 12 month)
      expect(result.readUInt16BE(offset)).toBe(2026);
      offset += 2;
      expect(result[offset]).toBe(12);
      offset += 1;

      // Verify createdAt (3 bytes: 2025 year + 12 month)
      expect(result.readUInt16BE(offset)).toBe(2025);
      offset += 2;
      expect(result[offset]).toBe(12);
      offset += 1;

      // Verify revealed attributes count (2 bytes, u16)
      expect(result.readUInt16BE(offset)).toBe(0);
    });

    it("should serialize credential with multiple keys", () => {
      // GIVEN
      const transaction: CredentialDeploymentTransaction = {
        credentialPublicKeys: {
          keys: {
            "0": { schemeId: "Ed25519", verifyKey: "11".repeat(32) },
            "1": { schemeId: "Ed25519", verifyKey: "22".repeat(32) },
            "2": { schemeId: "Ed25519", verifyKey: "33".repeat(32) },
          },
          threshold: 2,
        },
        credId: "a".repeat(96),
        ipIdentity: 5,
        revocationThreshold: 3,
        arData: {},
        policy: {
          validTo: "209912",
          createdAt: "202401",
          revealedAttributes: {},
        },
        proofs: {
          sig: "d".repeat(128),
          commitments: "e".repeat(96),
          challenge: "f".repeat(64),
          proofIdCredPub: {},
          proofIpSig: "11".repeat(64),
          proofRegId: "22".repeat(64),
          credCounterLessThanMaxAccounts: "33".repeat(64),
        },
        expiry: 2000000n,
      };

      // WHEN
      const result = serializeCredentialDeploymentValues(transaction);

      // THEN
      expect(result[0]).toBe(3); // Three keys

      let offset = 1;

      // First key
      expect(result[offset]).toBe(0); // Index 0
      offset += 1;
      expect(result[offset]).toBe(0); // Ed25519
      offset += 1;
      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("11".repeat(32));
      offset += 32;

      // Second key
      expect(result[offset]).toBe(1); // Index 1
      offset += 1;
      expect(result[offset]).toBe(0); // Ed25519
      offset += 1;
      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("22".repeat(32));
      offset += 32;

      // Third key
      expect(result[offset]).toBe(2); // Index 2
      offset += 1;
      expect(result[offset]).toBe(0); // Ed25519
      offset += 1;
      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("33".repeat(32));
      offset += 32;

      // Threshold
      expect(result[offset]).toBe(2);
    });

    it("should serialize credential with multiple anonymity revokers", () => {
      // GIVEN
      const transaction: CredentialDeploymentTransaction = {
        credentialPublicKeys: {
          keys: { "0": { schemeId: "Ed25519", verifyKey: "a".repeat(64) } },
          threshold: 1,
        },
        credId: "b".repeat(96),
        ipIdentity: 0,
        revocationThreshold: 2,
        arData: {
          "1": { encIdCredPubShare: "11".repeat(96) },
          "2": { encIdCredPubShare: "22".repeat(96) },
          "3": { encIdCredPubShare: "33".repeat(96) },
        },
        policy: {
          validTo: "202612",
          createdAt: "202512",
          revealedAttributes: {},
        },
        proofs: {
          sig: "d".repeat(128),
          commitments: "e".repeat(96),
          challenge: "f".repeat(64),
          proofIdCredPub: {},
          proofIpSig: "11".repeat(64),
          proofRegId: "22".repeat(64),
          credCounterLessThanMaxAccounts: "33".repeat(64),
        },
        expiry: 1000000n,
      };

      // WHEN
      const result = serializeCredentialDeploymentValues(transaction);

      // THEN
      let offset = 0;

      // Skip keys
      offset += 1; // key count
      offset += 1 + 1 + 32; // key 0

      // Skip threshold
      offset += 1;

      // Skip credId
      offset += 48;

      // Skip ipIdentity
      offset += 4;

      // Skip revocationThreshold
      offset += 1;

      // Check arData count
      expect(result.readUInt16BE(offset)).toBe(3);
      offset += 2;

      // Check AR 1
      expect(result.readUInt32BE(offset)).toBe(1);
      offset += 4;
      expect(result.subarray(offset, offset + 96).toString("hex")).toBe("11".repeat(96));
      offset += 96;

      // Check AR 2
      expect(result.readUInt32BE(offset)).toBe(2);
      offset += 4;
      expect(result.subarray(offset, offset + 96).toString("hex")).toBe("22".repeat(96));
      offset += 96;

      // Check AR 3
      expect(result.readUInt32BE(offset)).toBe(3);
      offset += 4;
      expect(result.subarray(offset, offset + 96).toString("hex")).toBe("33".repeat(96));
    });

    it("should serialize credential with revealed attributes", () => {
      // GIVEN
      const transaction: CredentialDeploymentTransaction = {
        credentialPublicKeys: {
          keys: { "0": { schemeId: "Ed25519", verifyKey: "a".repeat(64) } },
          threshold: 1,
        },
        credId: "b".repeat(96),
        ipIdentity: 0,
        revocationThreshold: 2,
        arData: {},
        policy: {
          validTo: "202612",
          createdAt: "202512",
          revealedAttributes: {
            "0": "John",
            "1": "Doe",
            "2": "US",
          },
        },
        proofs: {
          sig: "d".repeat(128),
          commitments: "e".repeat(96),
          challenge: "f".repeat(64),
          proofIdCredPub: {},
          proofIpSig: "11".repeat(64),
          proofRegId: "22".repeat(64),
          credCounterLessThanMaxAccounts: "33".repeat(64),
        },
        expiry: 1000000n,
      };

      // WHEN
      const result = serializeCredentialDeploymentValues(transaction);

      // THEN
      let offset = 0;

      // Skip to revealed attributes
      offset += 1 + (1 + 1 + 32) + 1; // keys + threshold
      offset += 48 + 4 + 1; // credId + ipIdentity + revocationThreshold
      offset += 2; // arData count (0 entries)
      offset += 3 + 3; // validTo + createdAt

      // Check revealed attributes count
      expect(result.readUInt16BE(offset)).toBe(3);
      offset += 2;

      // Attributes should be sorted by tag (0, 1, 2)
      // Attribute 0: "John"
      expect(result[offset]).toBe(0); // Tag
      offset += 1;
      expect(result[offset]).toBe(4); // Length
      offset += 1;
      expect(result.subarray(offset, offset + 4).toString("utf-8")).toBe("John");
      offset += 4;

      // Attribute 1: "Doe"
      expect(result[offset]).toBe(1); // Tag
      offset += 1;
      expect(result[offset]).toBe(3); // Length
      offset += 1;
      expect(result.subarray(offset, offset + 3).toString("utf-8")).toBe("Doe");
      offset += 3;

      // Attribute 2: "US"
      expect(result[offset]).toBe(2); // Tag
      offset += 1;
      expect(result[offset]).toBe(2); // Length
      offset += 1;
      expect(result.subarray(offset, offset + 2).toString("utf-8")).toBe("US");
    });

    it("should sort revealed attributes by tag", () => {
      // GIVEN - attributes provided in non-sorted order
      const transaction: CredentialDeploymentTransaction = {
        credentialPublicKeys: {
          keys: { "0": { schemeId: "Ed25519", verifyKey: "a".repeat(64) } },
          threshold: 1,
        },
        credId: "b".repeat(96),
        ipIdentity: 0,
        revocationThreshold: 2,
        arData: {},
        policy: {
          validTo: "202612",
          createdAt: "202512",
          revealedAttributes: {
            "5": "Five",
            "1": "One",
            "3": "Three",
          },
        },
        proofs: {
          sig: "d".repeat(128),
          commitments: "e".repeat(96),
          challenge: "f".repeat(64),
          proofIdCredPub: {},
          proofIpSig: "11".repeat(64),
          proofRegId: "22".repeat(64),
          credCounterLessThanMaxAccounts: "33".repeat(64),
        },
        expiry: 1000000n,
      };

      // WHEN
      const result = serializeCredentialDeploymentValues(transaction);

      // THEN
      let offset = 0;

      // Skip to revealed attributes
      offset += 1 + (1 + 1 + 32) + 1; // keys + threshold
      offset += 48 + 4 + 1; // credId + ipIdentity + revocationThreshold
      offset += 2; // arData count
      offset += 3 + 3; // validTo + createdAt
      offset += 2; // attributes count

      // Should be sorted: 1, 3, 5
      expect(result[offset]).toBe(1); // Tag 1
      offset += 1;
      expect(result[offset]).toBe(3); // Length
      offset += 1;
      expect(result.subarray(offset, offset + 3).toString("utf-8")).toBe("One");
      offset += 3;

      expect(result[offset]).toBe(3); // Tag 3
      offset += 1;
      expect(result[offset]).toBe(5); // Length
      offset += 1;
      expect(result.subarray(offset, offset + 5).toString("utf-8")).toBe("Three");
      offset += 5;

      expect(result[offset]).toBe(5); // Tag 5
      offset += 1;
      expect(result[offset]).toBe(4); // Length
      offset += 1;
      expect(result.subarray(offset, offset + 4).toString("utf-8")).toBe("Five");
    });

    it("should handle empty arData", () => {
      // GIVEN
      const transaction: CredentialDeploymentTransaction = {
        credentialPublicKeys: {
          keys: { "0": { schemeId: "Ed25519", verifyKey: "a".repeat(64) } },
          threshold: 1,
        },
        credId: "b".repeat(96),
        ipIdentity: 0,
        revocationThreshold: 2,
        arData: {},
        policy: {
          validTo: "202612",
          createdAt: "202512",
          revealedAttributes: {},
        },
        proofs: {
          sig: "d".repeat(128),
          commitments: "e".repeat(96),
          challenge: "f".repeat(64),
          proofIdCredPub: {},
          proofIpSig: "11".repeat(64),
          proofRegId: "22".repeat(64),
          credCounterLessThanMaxAccounts: "33".repeat(64),
        },
        expiry: 1000000n,
      };

      // WHEN
      const result = serializeCredentialDeploymentValues(transaction);

      // THEN
      let offset = 0;

      // Skip to arData
      offset += 1 + (1 + 1 + 32) + 1; // keys + threshold
      offset += 48 + 4 + 1; // credId + ipIdentity + revocationThreshold

      // Check arData count is 0
      expect(result.readUInt16BE(offset)).toBe(0);
    });
  });

  describe("deserializeTransfer", () => {
    it("should deserialize a Transfer transaction", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 42n,
          expiry: 1234567890n,
          energyAmount: 501n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000000n,
        },
      };

      // WHEN - serialize then deserialize
      const serialized = serializeTransfer(tx);
      const result = deserializeTransfer(serialized);

      // THEN - verify all fields match
      expect(result.header.sender.toBuffer()).toEqual(tx.header.sender.toBuffer());
      expect(result.header.nonce).toBe(tx.header.nonce);
      expect(result.header.expiry).toBe(tx.header.expiry);
      expect(result.header.energyAmount).toBe(tx.header.energyAmount);
      expect(result.type).toBe(TransactionType.Transfer);
      expect(result.payload.toAddress.toBuffer()).toEqual(tx.payload.toAddress.toBuffer());
      expect(result.payload.amount).toBe(tx.payload.amount);
    });

    it("should handle maximum values", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0xff)),
          nonce: 18446744073709551615n, // Max u64
          expiry: 18446744073709551615n,
          energyAmount: 18446744073709551615n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0xaa)),
          amount: 18446744073709551615n,
        },
      };

      // WHEN
      const serialized = serializeTransfer(tx);
      const result = deserializeTransfer(serialized);

      // THEN
      expect(result.header.nonce).toBe(18446744073709551615n);
      expect(result.header.expiry).toBe(18446744073709551615n);
      expect(result.header.energyAmount).toBe(18446744073709551615n);
      expect(result.payload.amount).toBe(18446744073709551615n);
    });

    it("should throw error for invalid transaction type", () => {
      // GIVEN - manually craft buffer with wrong type
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
        },
      };
      const serialized = serializeTransfer(tx);

      // Corrupt the type byte (offset 32+8+8+4+8 = 60)
      serialized[60] = TransactionType.TransferWithMemo;

      // WHEN/THEN
      expect(() => deserializeTransfer(serialized)).toThrow("Expected Transfer type (3), got 22");
    });

    it("should throw error for invalid payload size", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
        },
      };
      const serialized = serializeTransfer(tx);

      // Corrupt the payload size (offset 32+8+8 = 48)
      serialized.writeUInt32BE(999, 48);

      // WHEN/THEN
      expect(() => deserializeTransfer(serialized)).toThrow("Invalid payload size for Transfer");
    });
  });

  describe("deserializeTransferWithMemo", () => {
    it("should deserialize a TransferWithMemo transaction", () => {
      // GIVEN
      const memoData = Buffer.from("Hello Concordium");
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 42n,
          expiry: 1234567890n,
          energyAmount: 601n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000000n,
          memo: memoData,
        },
      };

      // WHEN - serialize then deserialize
      const serialized = serializeTransferWithMemo(tx);
      const result = deserializeTransferWithMemo(serialized);

      // THEN - verify all fields match
      expect(result.header.sender.toBuffer()).toEqual(tx.header.sender.toBuffer());
      expect(result.header.nonce).toBe(tx.header.nonce);
      expect(result.header.expiry).toBe(tx.header.expiry);
      expect(result.header.energyAmount).toBe(tx.header.energyAmount);
      expect(result.type).toBe(TransactionType.TransferWithMemo);
      expect(result.payload.toAddress.toBuffer()).toEqual(tx.payload.toAddress.toBuffer());
      expect(result.payload.amount).toBe(tx.payload.amount);
      expect("memo" in result.payload && result.payload.memo).toEqual(memoData);
    });

    it("should handle empty memo", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: Buffer.alloc(0),
        },
      };

      // WHEN
      const serialized = serializeTransferWithMemo(tx);
      const result = deserializeTransferWithMemo(serialized);

      // THEN
      expect("memo" in result.payload && result.payload.memo.length).toBe(0);
    });

    it("should handle large memo", () => {
      // GIVEN - memo at maximum size (254 bytes before CBOR encoding)
      const memoData = Buffer.alloc(200, 0xaa);
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: memoData,
        },
      };

      // WHEN
      const serialized = serializeTransferWithMemo(tx);
      const result = deserializeTransferWithMemo(serialized);

      // THEN
      expect("memo" in result.payload && result.payload.memo).toEqual(memoData);
      expect("memo" in result.payload && result.payload.memo.length).toBe(200);
    });

    it("should handle maximum values", () => {
      // GIVEN
      const memoData = Buffer.from("test");
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0xff)),
          nonce: 18446744073709551615n,
          expiry: 18446744073709551615n,
          energyAmount: 18446744073709551615n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0xaa)),
          amount: 18446744073709551615n,
          memo: memoData,
        },
      };

      // WHEN
      const serialized = serializeTransferWithMemo(tx);
      const result = deserializeTransferWithMemo(serialized);

      // THEN
      expect(result.header.nonce).toBe(18446744073709551615n);
      expect(result.header.expiry).toBe(18446744073709551615n);
      expect(result.header.energyAmount).toBe(18446744073709551615n);
      expect(result.payload.amount).toBe(18446744073709551615n);
    });

    it("should throw error for invalid transaction type", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: Buffer.from("test"),
        },
      };
      const serialized = serializeTransferWithMemo(tx);

      // Corrupt the type byte (offset 60)
      serialized[60] = TransactionType.Transfer;

      // WHEN/THEN
      expect(() => deserializeTransferWithMemo(serialized)).toThrow(
        "Expected TransferWithMemo type (22), got 3",
      );
    });

    it("should throw error for invalid payload size", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: Buffer.from("test"),
        },
      };
      const serialized = serializeTransferWithMemo(tx);

      // Corrupt the payload size (offset 48)
      serialized.writeUInt32BE(999, 48);

      // WHEN/THEN
      expect(() => deserializeTransferWithMemo(serialized)).toThrow(
        "Invalid payload size for TransferWithMemo",
      );
    });
  });

  describe("serializeTransfer error handling", () => {
    it("should throw error when transaction type is not Transfer", () => {
      // GIVEN - TransferWithMemo transaction passed to serializeTransfer
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: Buffer.from("test"),
        },
      };

      // WHEN/THEN
      expect(() => serializeTransfer(tx)).toThrow("Transaction must be Transfer type");
    });
  });

  describe("serializeTransferWithMemo error handling", () => {
    it("should throw error when transaction type is not TransferWithMemo", () => {
      // GIVEN - Transfer transaction passed to serializeTransferWithMemo
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
        },
      };

      // WHEN/THEN
      expect(() => serializeTransferWithMemo(tx)).toThrow(
        "Transaction must be TransferWithMemo type",
      );
    });

    it("should throw error when payload is missing memo", () => {
      // GIVEN - TransferWithMemo type but payload missing memo field
      // Create a valid payload first, then delete the memo to bypass TypeScript checking
      const payload = {
        toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
        amount: 1000n,
        memo: Buffer.from("temp"),
      };
      // oxlint-disable-next-line typescript/consistent-type-assertions
      delete (payload as Partial<typeof payload>).memo;

      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload,
      };

      // WHEN/THEN
      expect(() => serializeTransferWithMemo(tx)).toThrow(
        "TransferWithMemo payload must contain memo",
      );
    });

    it("should throw error when memo exceeds device limit", () => {
      // GIVEN - TransferWithMemo with memo > 256 bytes
      // Device/protocol limit: CBOR-encoded memo must be ≤ 256 bytes
      const largeMemo = Buffer.alloc(257, 0xaa);
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: largeMemo,
        },
      };

      // WHEN/THEN
      expect(() => serializeTransferWithMemo(tx)).toThrow(
        /Memo size 257 bytes exceeds device limit of 256 bytes/,
      );
    });

    it("should accept memo at exactly device limit (256 bytes)", () => {
      // GIVEN - TransferWithMemo with memo exactly at 256 byte limit
      const maxMemo = Buffer.alloc(256, 0xaa);
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: maxMemo,
        },
      };

      // WHEN
      const result = serializeTransferWithMemo(tx);

      // THEN - should not throw and produce valid serialization
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getTransactionType", () => {
    it("should detect Transfer transaction type", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
        },
      };
      const serialized = serializeTransfer(tx);

      // WHEN
      const detectedType = getTransactionType(serialized);

      // THEN
      expect(detectedType).toBe(TransactionType.Transfer);
    });

    it("should detect TransferWithMemo transaction type", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: Buffer.from("Hello, Concordium!", "utf-8"),
        },
      };
      const serialized = serializeTransferWithMemo(tx);

      // WHEN
      const detectedType = getTransactionType(serialized);

      // THEN
      expect(detectedType).toBe(TransactionType.TransferWithMemo);
    });

    it("should throw error for buffer that is too short", () => {
      // GIVEN
      const shortBuffer = Buffer.alloc(50); // Less than 61 bytes required

      // WHEN/THEN
      expect(() => getTransactionType(shortBuffer)).toThrow("Transaction buffer too short");
    });

    it("should throw error for unsupported transaction type", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
        },
      };
      const serialized = serializeTransfer(tx);

      // Modify type byte to invalid value
      const TYPE_OFFSET = 60;
      serialized[TYPE_OFFSET] = 99; // Invalid type

      // WHEN/THEN
      expect(() => getTransactionType(serialized)).toThrow("Unsupported transaction type: 99");
    });
  });

  describe("deserializeTransaction", () => {
    it("should deserialize Transfer transaction", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 42n,
          expiry: 2000n,
          energyAmount: 1000n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 5000n,
        },
      };
      const serialized = serializeTransfer(tx);

      // WHEN
      const deserialized = deserializeTransaction(serialized);

      // THEN
      expect(deserialized.type).toBe(TransactionType.Transfer);
      expect(deserialized.header.nonce).toBe(42n);
      expect(deserialized.payload.amount).toBe(5000n);
    });

    it("should deserialize TransferWithMemo transaction", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 99n,
          expiry: 3000n,
          energyAmount: 2000n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 10000n,
          memo: Buffer.from("Test memo", "utf-8"),
        },
      };
      const serialized = serializeTransferWithMemo(tx);

      // WHEN
      const deserialized = deserializeTransaction(serialized);

      // THEN
      expect(deserialized.type).toBe(TransactionType.TransferWithMemo);
      expect(deserialized.header.nonce).toBe(99n);
      expect(deserialized.payload.amount).toBe(10000n);
      expect((deserialized.payload as TransferWithMemoPayload).memo?.toString("utf-8")).toBe(
        "Test memo",
      );
    });

    it("should throw error for invalid buffer", () => {
      // GIVEN
      const invalidBuffer = Buffer.alloc(50); // Too short

      // WHEN/THEN
      expect(() => deserializeTransaction(invalidBuffer)).toThrow("Transaction buffer too short");
    });
  });

  describe("serializeTransaction", () => {
    it("should serialize Transfer transaction", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 123n,
          expiry: 4000n,
          energyAmount: 1500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 7500n,
        },
      };

      // WHEN
      const serialized = serializeTransaction(tx);

      // THEN - Should be able to deserialize back to same transaction
      const deserialized = deserializeTransaction(serialized);
      expect(deserialized.type).toBe(TransactionType.Transfer);
      expect(deserialized.header.nonce).toBe(123n);
      expect(deserialized.payload.amount).toBe(7500n);
    });

    it("should serialize TransferWithMemo transaction", () => {
      // GIVEN
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 456n,
          expiry: 5000n,
          energyAmount: 2500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 12000n,
          memo: Buffer.from("Roundtrip test", "utf-8"),
        },
      };

      // WHEN
      const serialized = serializeTransaction(tx);

      // THEN - Should be able to deserialize back to same transaction
      const deserialized = deserializeTransaction(serialized);
      expect(deserialized.type).toBe(TransactionType.TransferWithMemo);
      expect(deserialized.header.nonce).toBe(456n);
      expect(deserialized.payload.amount).toBe(12000n);
      expect((deserialized.payload as TransferWithMemoPayload).memo?.toString("utf-8")).toBe(
        "Roundtrip test",
      );
    });
  });

  describe("insertAccountOwnershipProofs", () => {
    const baseProofs = {
      sig: "aa".repeat(64),
      commitments: "bb".repeat(48),
      challenge: "cc".repeat(32),
      proofIdCredPub: {},
      proofIpSig: "dd".repeat(32),
      proofRegId: "ee".repeat(32),
      credCounterLessThanMaxAccounts: "ff".repeat(32),
    };
    const accountSignature = "ab".repeat(64);

    it("should return a hex string", () => {
      // WHEN
      const result = insertAccountOwnershipProofs(baseProofs, accountSignature);

      // THEN
      expect(typeof result).toBe("string");
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    it("should insert account proof between proofRegId and credCounterLessThanMaxAccounts", () => {
      // WHEN
      const result = insertAccountOwnershipProofs(baseProofs, accountSignature);
      const buf = Buffer.from(result, "hex");

      // prefix: sig(64) + commitments(48) + challenge(32) + proofIdCredPubCount(4) + proofIpSig(32) + proofRegId(32)
      const prefixLen = 64 + 48 + 32 + 4 + 32 + 32;
      // account proof: count(1) + keyIndex(1) + signature(64) = 66
      const accountProofLen = 1 + 1 + 64;
      // credCounterLessThanMaxAccounts: 32 bytes
      const credCounterLen = 32;

      expect(buf.length).toBe(prefixLen + accountProofLen + credCounterLen);

      // Account proof starts at prefixLen: count=1, keyIndex=0, signature
      expect(buf[prefixLen]).toBe(1);
      expect(buf[prefixLen + 1]).toBe(0);
      expect(buf.subarray(prefixLen + 2, prefixLen + 66).toString("hex")).toBe(accountSignature);

      // credCounterLessThanMaxAccounts is at the end
      expect(buf.subarray(prefixLen + accountProofLen).toString("hex")).toBe("ff".repeat(32));
    });

    it("should sort proofIdCredPub entries by index", () => {
      // GIVEN
      const proofsWithEntries = {
        ...baseProofs,
        proofIdCredPub: {
          "1": "11".repeat(64),
          "0": "00".repeat(64),
        },
      };

      // WHEN
      const result = insertAccountOwnershipProofs(proofsWithEntries, accountSignature);
      const buf = Buffer.from(result, "hex");

      // proofIdCredPub count should be 2, first entry index should be 0
      const countOffset = 64 + 48 + 32;
      expect(buf.readUInt32BE(countOffset)).toBe(2);
      expect(buf.readUInt32BE(countOffset + 4)).toBe(0); // First entry index is 0
    });
  });
});

describe("serialization: TokenUpdate (PLT)", () => {
  const SENDER = AccountAddress.fromBuffer(Buffer.alloc(32, 0xaa));
  const RECIPIENT = AccountAddress.fromBuffer(Buffer.alloc(32, 0xbb));

  const header = {
    sender: SENDER,
    nonce: 10n,
    energyAmount: 100n,
    expiry: 1675432871n,
  };

  const buildTransaction = (
    overrides: Partial<TokenUpdateTransaction["payload"]> = {},
  ): TokenUpdateTransaction => ({
    header,
    type: TransactionType.TokenUpdate,
    payload: {
      tokenId: Buffer.from("PLT", "utf-8"),
      operations: encodePltTransferOperations({
        recipient: RECIPIENT,
        amount: 1_000_000n,
        decimals: 6,
      }),
      ...overrides,
    },
  });

  describe("serializeTokenUpdate", () => {
    it("lays out the flat wire transaction the device hashes", () => {
      const tx = buildTransaction();
      const serialized = serializeTokenUpdate(tx);

      const { tokenId, operations } = tx.payload;
      const cborLengthOffset = 60 + 1 + 1 + tokenId.length;

      expect(serialized.subarray(0, 32)).toEqual(SENDER.toBuffer());
      // The kind byte lands at offset 60, which is what keeps the existing
      // TYPE_OFFSET dispatch working in both this package and the signer.
      expect(serialized.readUInt8(60)).toBe(0x1b);
      expect(serialized.readUInt8(61)).toBe(tokenId.length);
      expect(serialized.subarray(62, 62 + tokenId.length)).toEqual(tokenId);
      expect(serialized.readUInt32BE(cborLengthOffset)).toBe(operations.length);
      expect(serialized.subarray(cborLengthOffset + 4)).toEqual(operations);
    });

    it("counts the kind byte in the header payload size", () => {
      const tx = buildTransaction();
      const serialized = serializeTokenUpdate(tx);
      const payloadLength = 1 + 1 + tx.payload.tokenId.length + 4 + tx.payload.operations.length;

      expect(serialized.readUInt32BE(48)).toBe(payloadLength);
    });

    it("accepts the shortest and longest token id the device allows", () => {
      expect(() =>
        serializeTokenUpdate(buildTransaction({ tokenId: Buffer.alloc(1) })),
      ).not.toThrow();
      expect(() =>
        serializeTokenUpdate(buildTransaction({ tokenId: Buffer.alloc(128) })),
      ).not.toThrow();
    });

    it.each([
      ["an empty token id", Buffer.alloc(0)],
      ["a token id above 128 bytes", Buffer.alloc(129)],
    ])("rejects %s", (_label, tokenId) => {
      expect(() => serializeTokenUpdate(buildTransaction({ tokenId }))).toThrow(
        /Token id length .* outside the device range/,
      );
    });

    it("rejects an empty operations blob", () => {
      expect(() => serializeTokenUpdate(buildTransaction({ operations: Buffer.alloc(0) }))).toThrow(
        /must not be empty/,
      );
    });

    it("rejects an operations blob above the device CBOR budget", () => {
      expect(() =>
        serializeTokenUpdate(buildTransaction({ operations: Buffer.alloc(513) })),
      ).toThrow(/exceeding the device limit/);
    });

    // The blob is opaque bytes here, so nothing stops a caller skipping
    // encodePltTransferOperations. The device answers a second operation with
    // 0x6B10 only after the user has been prompted, so reject it locally.
    it("rejects a multi-operation array smuggled in as raw bytes", () => {
      const single = buildTransaction().payload.operations;
      const twoOps = Buffer.concat([Buffer.from([0x82]), single.subarray(1), single.subarray(1)]);

      expect(() => serializeTokenUpdate(buildTransaction({ operations: twoOps }))).toThrow(
        /single-element CBOR array/,
      );
    });

    it("rejects an operations blob that is not a CBOR array at all", () => {
      expect(() =>
        serializeTokenUpdate(buildTransaction({ operations: Buffer.from([0x00]) })),
      ).toThrow(/single-element CBOR array/);
    });

    it("rejects a TokenUpdate carrying a CCD payload", () => {
      const mislabelled = {
        header,
        type: TransactionType.TokenUpdate,
        payload: { toAddress: RECIPIENT, amount: 5000n },
      } as unknown as TokenUpdateTransaction;

      expect(() => serializeTokenUpdate(mislabelled)).toThrow(
        /must contain tokenId and operations/,
      );
    });

    it("rejects a transaction of the wrong type", () => {
      const wrongType = {
        ...buildTransaction(),
        type: TransactionType.Transfer,
      } as unknown as TokenUpdateTransaction;

      expect(() => serializeTokenUpdate(wrongType)).toThrow(/must be TokenUpdate type/);
    });
  });

  describe("deserializeTokenUpdate", () => {
    it("round-trips a transaction", () => {
      const tx = buildTransaction();
      const decoded = deserializeTokenUpdate(serializeTokenUpdate(tx));

      expect(decoded.type).toBe(TransactionType.TokenUpdate);
      expect(decoded.header.nonce).toBe(10n);
      expect(decoded.header.energyAmount).toBe(100n);
      expect(decoded.header.expiry).toBe(1675432871n);
      expect(decoded.header.sender.toBuffer()).toEqual(SENDER.toBuffer());
      expect(decoded.payload.tokenId).toEqual(tx.payload.tokenId);
      expect(decoded.payload.operations).toEqual(tx.payload.operations);
    });

    it("round-trips a 128-byte token id", () => {
      const tokenId = Buffer.alloc(128, 0x7a);
      const decoded = deserializeTokenUpdate(serializeTokenUpdate(buildTransaction({ tokenId })));

      expect(decoded.payload.tokenId).toEqual(tokenId);
    });

    it("rejects a buffer that is too short", () => {
      expect(() => deserializeTokenUpdate(Buffer.alloc(60))).toThrow(/too short/);
    });

    it("rejects a buffer whose kind byte is not TokenUpdate", () => {
      const serialized = serializeTokenUpdate(buildTransaction());
      serialized.writeUInt8(TransactionType.Transfer, 60);

      expect(() => deserializeTokenUpdate(serialized)).toThrow(/Expected TokenUpdate type/);
    });

    it("rejects a declared CBOR length that disagrees with the remaining bytes", () => {
      const serialized = serializeTokenUpdate(buildTransaction());
      const cborLengthOffset = 60 + 2 + 3;
      // Inside the device range, so this exercises the mismatch check rather
      // than the bounds check below.
      serialized.writeUInt32BE(500, cborLengthOffset);

      expect(() => deserializeTokenUpdate(serialized)).toThrow(/does not match/);
    });

    it.each([0, 513])("rejects a declared CBOR length of %s", cborLength => {
      const serialized = serializeTokenUpdate(buildTransaction());
      serialized.writeUInt32BE(cborLength, 60 + 2 + 3);

      expect(() => deserializeTokenUpdate(serialized)).toThrow(
        /outside the device range of 1\.\.512/,
      );
    });

    it("rejects a header payloadSize that disagrees with the payload", () => {
      const serialized = serializeTokenUpdate(buildTransaction());
      serialized.writeUInt32BE(999, 48);

      expect(() => deserializeTokenUpdate(serialized)).toThrow(/Invalid payload size/);
    });
  });

  describe("dispatchers", () => {
    it("reports TokenUpdate from getTransactionType", () => {
      const serialized = serializeTokenUpdate(buildTransaction());

      expect(getTransactionType(serialized)).toBe(TransactionType.TokenUpdate);
    });

    it("routes TokenUpdate through serializeTransaction", () => {
      const tx = buildTransaction();

      expect(serializeTransaction(tx)).toEqual(serializeTokenUpdate(tx));
    });

    it("narrows a TokenUpdate transaction", () => {
      expect(isTokenUpdateTransaction(buildTransaction())).toBe(true);
    });

    // An unsafe cast can produce a CCD-shaped object that claims to be
    // TokenUpdate. The guard must not wave it through to the PLT serializer.
    it("does not narrow a CCD payload mislabelled as TokenUpdate", () => {
      const mislabelled = {
        header,
        type: TransactionType.TokenUpdate,
        payload: { toAddress: RECIPIENT, amount: 5000n },
      } as unknown as Transaction;

      expect(isTokenUpdateTransaction(mislabelled)).toBe(false);
    });

    // A JS caller or an unsafe cast can supply these; the guard must return
    // false rather than throw on the `in` operator.
    it.each([
      ["a null payload", null],
      ["an undefined payload", undefined],
      ["a primitive payload", 42],
    ])("does not narrow %s", (_label, payload) => {
      const malformed = {
        header,
        type: TransactionType.TokenUpdate,
        payload,
      } as unknown as Transaction;

      expect(() => isTokenUpdateTransaction(malformed)).not.toThrow();
      expect(isTokenUpdateTransaction(malformed)).toBe(false);
    });

    // Presence alone is not enough: a payload with the right keys but the wrong
    // field types would reach serializeTokenUpdate and fail on readUInt8.
    it("does not narrow a payload whose fields are not Buffers", () => {
      const wrongTypes = {
        header,
        type: TransactionType.TokenUpdate,
        payload: { tokenId: "PLT", operations: "deadbeef" },
      } as unknown as Transaction;

      expect(isTokenUpdateTransaction(wrongTypes)).toBe(false);
      expect(() => serializeTransaction(wrongTypes)).toThrow(
        /Unsupported transaction type for serialization/,
      );
    });

    it("does not narrow a CCD transfer", () => {
      const transfer: Transaction = {
        header,
        type: TransactionType.Transfer,
        payload: { toAddress: RECIPIENT, amount: 5000n },
      };

      expect(isTokenUpdateTransaction(transfer)).toBe(false);
    });

    // deserializeTransaction stays CCD-only: production never decodes a PLT
    // payload, so it points the caller at the explicit function instead of
    // returning a widened type that would defeat narrowing at every CCD site.
    it("refuses TokenUpdate in deserializeTransaction with a directed message", () => {
      const serialized = serializeTokenUpdate(buildTransaction());

      expect(() => deserializeTransaction(serialized)).toThrow(/use deserializeTokenUpdate/);
    });
  });

  describe("CCD paths are unaffected", () => {
    it("still serializes a Transfer identically", () => {
      const transfer: Transaction = {
        header,
        type: TransactionType.Transfer,
        payload: { toAddress: RECIPIENT, amount: 5000n },
      };

      const serialized = serializeTransfer(transfer);

      expect(serialized.readUInt8(60)).toBe(TransactionType.Transfer);
      expect(serialized).toHaveLength(101);
      expect(deserializeTransaction(serialized).type).toBe(TransactionType.Transfer);
    });
  });
});
