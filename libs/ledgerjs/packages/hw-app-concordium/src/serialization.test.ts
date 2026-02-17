import {
  serializeTransactionPayloads,
  serializeCredentialDeploymentValues,
  serializeTransfer,
  serializeTransferWithMemo,
  deserializeTransfer,
  deserializeTransferWithMemo,
  prepareTransferAPDU,
  prepareTransferWithMemoAPDU,
} from "./serialization";
import { pathToBuffer } from "./utils";
import { AccountAddress } from "./address";
import { TransactionType } from "./types";
import type { CredentialDeploymentTransaction, Transaction } from "./types";

describe("serialization", () => {
  describe("pathToBuffer", () => {
    it("should serialize standard Concordium path", () => {
      // GIVEN
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = pathToBuffer(path);

      // THEN
      expect(result[0]).toBe(5);
      expect(result.readUInt32BE(1)).toBe(0x8000002c);
      expect(result.readUInt32BE(5)).toBe(0x80000397);
      expect(result.readUInt32BE(9)).toBe(0x80000000);
      expect(result.readUInt32BE(13)).toBe(0);
      expect(result.readUInt32BE(17)).toBe(0);
      expect(result.length).toBe(21);
    });

    it("should serialize short path", () => {
      // GIVEN
      const path = "44'/919'";

      // WHEN
      const result = pathToBuffer(path);

      // THEN
      expect(result[0]).toBe(2);
      expect(result.length).toBe(9);
    });

    it("should handle path with m/ prefix", () => {
      // GIVEN
      const path = "m/44'/919'/0'";

      // WHEN
      const result = pathToBuffer(path);

      // THEN
      expect(result[0]).toBe(3);
      expect(result.length).toBe(13);
    });
  });

  describe("serializeTransactionPayloads", () => {
    it("should handle data smaller than chunk size", () => {
      // GIVEN
      const data = Buffer.alloc(100, 0xaa);

      // WHEN
      const result = serializeTransactionPayloads(data);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(data);
    });

    it("should chunk data at 255 byte boundary", () => {
      // GIVEN
      const data = Buffer.alloc(255, 0xaa);

      // WHEN
      const result = serializeTransactionPayloads(data);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(255);
    });

    it("should split data larger than 255 bytes", () => {
      // GIVEN
      const data = Buffer.alloc(300, 0xaa);

      // WHEN
      const result = serializeTransactionPayloads(data);

      // THEN
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(255);
      expect(result[1].length).toBe(45);
    });

    it("should handle exactly 256 bytes", () => {
      // GIVEN
      const data = Buffer.alloc(256, 0xaa);

      // WHEN
      const result = serializeTransactionPayloads(data);

      // THEN
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(255);
      expect(result[1].length).toBe(1);
    });

    it("should handle multiple full chunks", () => {
      // GIVEN
      const data = Buffer.alloc(765, 0xaa);

      // WHEN
      const result = serializeTransactionPayloads(data);

      // THEN
      expect(result.length).toBe(3);
      expect(result[0].length).toBe(255);
      expect(result[1].length).toBe(255);
      expect(result[2].length).toBe(255);
    });

    it("should preserve data integrity across chunks", () => {
      // GIVEN
      const data = Buffer.from([...Array(300).keys()].map(i => i % 256));

      // WHEN
      const result = serializeTransactionPayloads(data);

      // THEN
      const reconstructed = Buffer.concat(result);
      expect(reconstructed).toEqual(data);
    });
  });

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

  describe("prepareTransferWithMemoAPDU", () => {
    it("should throw error for buffer too short for header", () => {
      // GIVEN - buffer shorter than minimum (95 bytes)
      const truncatedBuffer = Buffer.alloc(90);
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(truncatedBuffer, path)).toThrow(
        "Invalid TransferWithMemo buffer: expected at least 95 bytes, got 90",
      );
    });

    it("should throw error for missing memo_length field", () => {
      // GIVEN - buffer exactly at header end (93 bytes, missing memo_length)
      const truncatedBuffer = Buffer.alloc(93);
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(truncatedBuffer, path)).toThrow(
        "Invalid TransferWithMemo buffer: expected at least 95 bytes, got 93",
      );
    });

    it("should throw error for truncated memo", () => {
      // GIVEN - valid header with memo_length=10 but insufficient buffer
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
          memo: Buffer.alloc(10, 0xaa),
        },
      };
      const serialized = serializeTransferWithMemo(tx);
      // Truncate before amount field (remove last 8 bytes)
      const truncated = serialized.subarray(0, serialized.length - 8);
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(truncated, path)).toThrow(
        /Invalid TransferWithMemo buffer: expected \d+ bytes for memo \(10\) \+ amount \(8\), got \d+/,
      );
    });

    it("should throw error for truncated amount", () => {
      // GIVEN - valid header and memo but missing amount
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
          memo: Buffer.alloc(5, 0xaa),
        },
      };
      const serialized = serializeTransferWithMemo(tx);
      // Truncate in middle of amount field (remove last 4 bytes)
      const truncated = serialized.subarray(0, serialized.length - 4);
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(truncated, path)).toThrow(
        /Invalid TransferWithMemo buffer: expected \d+ bytes for memo \(5\) \+ amount \(8\), got \d+/,
      );
    });

    it("should successfully parse valid TransferWithMemo buffer", () => {
      // GIVEN - valid TransferWithMemo transaction
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
          memo: Buffer.from("Hello"),
        },
      };
      const serialized = serializeTransferWithMemo(tx);
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = prepareTransferWithMemoAPDU(serialized, path);

      // THEN
      expect(result.headerPayload).toBeDefined();
      expect(result.memoPayloads).toBeDefined();
      expect(result.amountPayload).toBeDefined();
      expect(result.memoPayloads.length).toBeGreaterThan(0);
      expect(result.amountPayload.length).toBe(8);
    });

    it("should throw error for wrong transaction type", () => {
      // GIVEN - Transfer transaction (not TransferWithMemo)
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
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(serialized, path)).toThrow(
        /Invalid transaction type: expected TransferWithMemo \(22\), got 3/,
      );
    });

    it("should throw error for corrupted type byte", () => {
      // GIVEN - valid TransferWithMemo with corrupted type byte
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
      // Corrupt type byte (offset 60: 32+8+8+4+8)
      serialized[60] = 99; // Invalid type
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(serialized, path)).toThrow(
        /Invalid transaction type: expected TransferWithMemo \(22\), got 99/,
      );
    });

    it("should throw error for inconsistent payload size", () => {
      // GIVEN - valid TransferWithMemo with corrupted payload size
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
      // Corrupt payload size (offset 48: 32+8+8)
      serialized.writeUInt32BE(9999, 48);
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(serialized, path)).toThrow(/Invalid payload size/);
    });

    it("should throw error for excessively long BIP32 path", () => {
      // GIVEN - artificially long path that would exceed APDU limit
      // Header payload size: path + 95 bytes fixed header
      // To exceed 255 bytes: need path > 160 bytes (1 + 40*4 = 161 bytes)
      const longPath = Array(40)
        .fill(0)
        .map((_, i) => `${i}'`)
        .join("/");
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

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(serialized, longPath)).toThrow(
        /Header payload exceeds APDU limit/,
      );
    });

    it("should ensure header payload respects 255-byte APDU limit", () => {
      // GIVEN - valid TransferWithMemo with normal path
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
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = prepareTransferWithMemoAPDU(serialized, path);

      // THEN - header payload must be ≤ 255 bytes (APDU Lc limit)
      expect(result.headerPayload.length).toBeLessThanOrEqual(255);
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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

  describe("prepareTransferAPDU", () => {
    it("should prepare APDU with path for single chunk", () => {
      // GIVEN - small transaction that fits in one chunk
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
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = prepareTransferAPDU(serialized, path);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].length).toBeGreaterThan(serialized.length); // Includes path
    });

    it("should split large transaction into multiple chunks", () => {
      // GIVEN - create a transaction large enough to require chunking
      // Need to make header large enough by using large nonce/expiry values
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
      // Create a larger serialized buffer by repeating it
      const serialized = serializeTransfer(tx);
      const largeSerialized = Buffer.concat([
        serialized,
        Buffer.alloc(300, 0xaa), // Add extra data to force chunking
      ]);
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = prepareTransferAPDU(largeSerialized, path);

      // THEN
      expect(result.length).toBeGreaterThan(1); // Multiple chunks
      // First chunk should include path
      const pathLength = pathToBuffer(path).length;
      expect(result[0].length).toBeGreaterThanOrEqual(pathLength);
    });

    it("should include path only in first chunk", () => {
      // GIVEN - transaction requiring multiple chunks
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
      const largeSerialized = Buffer.concat([serialized, Buffer.alloc(300, 0xaa)]);
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = prepareTransferAPDU(largeSerialized, path);

      // THEN
      // First chunk should be larger (includes path)
      expect(result[0].length).toBeGreaterThan(result[1].length);
      // Subsequent chunks should not include path
      if (result.length > 1) {
        expect(result[1].length).toBeLessThanOrEqual(255); // MAX_CHUNK_SIZE
      }
    });

    it("should ensure all chunks respect 255-byte APDU limit", () => {
      // GIVEN - large transaction with normal path
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
      const largeSerialized = Buffer.concat([serialized, Buffer.alloc(300, 0xaa)]);
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = prepareTransferAPDU(largeSerialized, path);

      // THEN - all chunks must be ≤ 255 bytes (APDU Lc limit)
      for (const chunk of result) {
        expect(chunk.length).toBeLessThanOrEqual(255);
      }
    });

    it("should throw error for excessively long BIP32 path", () => {
      // GIVEN - artificially long path that would exceed APDU limit
      // A BIP32 path buffer is: 1 byte (length) + 4 bytes per element
      // To exceed 255 bytes: need > 63 elements (1 + 64*4 = 257 bytes)
      const longPath = Array(64)
        .fill(0)
        .map((_, i) => `${i}'`)
        .join("/");
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

      // WHEN/THEN
      expect(() => prepareTransferAPDU(serialized, longPath)).toThrow(/BIP32 path too long/);
    });
  });
});
