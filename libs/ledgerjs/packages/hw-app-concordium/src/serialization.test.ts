import {
  serializeAccountTransaction,
  serializeTransaction,
  serializeTransactionPayloads,
  serializeTransactionPayloadsWithDerivationPath,
  serializeTransferWithMemo,
  serializeCredentialDeploymentValues,
} from "./serialization";
import { pathToBuffer } from "./utils";
import type { AccountTransaction, CredentialDeploymentTransaction } from "./types";

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

  describe("serializeAccountTransaction", () => {
    it("should serialize simple transaction", () => {
      // GIVEN
      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32, 0xaa),
        nonce: 10n,
        expiry: 1000000n,
        energyAmount: 5000n,
        transactionType: 3,
        payload: Buffer.from([0x01, 0x02, 0x03]),
      };

      // WHEN
      const result = serializeAccountTransaction(transaction);

      // THEN
      expect(result.subarray(0, 32)).toEqual(Buffer.alloc(32, 0xaa));
      expect(result.readBigUInt64BE(32)).toBe(10n);
      expect(result.readBigUInt64BE(40)).toBe(5000n);
      expect(result.readUInt32BE(48)).toBe(4);
      expect(result.readBigUInt64BE(52)).toBe(1000000n);
      expect(result[60]).toBe(3);
      expect(result.subarray(61)).toEqual(Buffer.from([0x01, 0x02, 0x03]));
    });

    it("should handle large values", () => {
      // GIVEN
      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32, 0xff),
        nonce: 18446744073709551615n,
        expiry: 18446744073709551615n,
        energyAmount: 18446744073709551615n,
        transactionType: 255,
        payload: Buffer.alloc(0),
      };

      // WHEN
      const result = serializeAccountTransaction(transaction);

      // THEN
      expect(result.readBigUInt64BE(32)).toBe(18446744073709551615n);
      expect(result.readBigUInt64BE(40)).toBe(18446744073709551615n);
      expect(result.readBigUInt64BE(52)).toBe(18446744073709551615n);
      expect(result[60]).toBe(255);
    });

    it("should calculate correct payload size", () => {
      // GIVEN
      const payload = Buffer.alloc(100, 0xbb);
      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32),
        nonce: 1n,
        expiry: 1n,
        energyAmount: 1n,
        transactionType: 1,
        payload,
      };

      // WHEN
      const result = serializeAccountTransaction(transaction);

      // THEN
      expect(result.readUInt32BE(48)).toBe(101);
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

  describe("serializeTransactionPayloadsWithDerivationPath", () => {
    it("should include path in first chunk", () => {
      // GIVEN
      const path = "44'/919'/0'/0/0";
      const data = Buffer.alloc(100, 0xaa);

      // WHEN
      const result = serializeTransactionPayloadsWithDerivationPath(path, data);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0][0]).toBe(5);
      expect(result[0].readUInt32BE(1)).toBe(0x8000002c);
    });

    it("should chunk large data with path in first chunk only", () => {
      // GIVEN
      const path = "44'/919'/0'/0/0";
      const data = Buffer.alloc(300, 0xaa);

      // WHEN
      const result = serializeTransactionPayloadsWithDerivationPath(path, data);

      // THEN
      expect(result.length).toBeGreaterThan(1);
      expect(result[0][0]).toBe(5);
      expect(result[1][0]).not.toBe(5);
    });

    it("should handle path + data fitting in one chunk", () => {
      // GIVEN
      const path = "44'/919'";
      const data = Buffer.alloc(200, 0xbb);

      // WHEN
      const result = serializeTransactionPayloadsWithDerivationPath(path, data);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(9 + 200);
    });

    it("should split when path + data exceeds chunk size", () => {
      // GIVEN
      const path = "44'/919'/0'/0/0";
      const data = Buffer.alloc(300, 0xcc);

      // WHEN
      const result = serializeTransactionPayloadsWithDerivationPath(path, data);

      // THEN
      expect(result.length).toBe(2);
      const pathLength = pathToBuffer(path).length;
      expect(result[0].length).toBe(pathLength + 255);
      expect(result[1].length).toBe(45);
    });

    it("should preserve data integrity with path", () => {
      // GIVEN
      const path = "44'/919'/0'/0/0";
      const data = Buffer.from([...Array(300).keys()].map(i => i % 256));

      // WHEN
      const result = serializeTransactionPayloadsWithDerivationPath(path, data);

      // THEN
      const pathBuffer = pathToBuffer(path);
      const reconstructed = Buffer.concat(result);
      const extractedPath = reconstructed.subarray(0, pathBuffer.length);
      const extractedData = reconstructed.subarray(pathBuffer.length);

      expect(extractedPath).toEqual(pathBuffer);
      expect(extractedData).toEqual(data);
    });
  });

  describe("serializeTransaction", () => {
    it("should serialize transaction with path", () => {
      // GIVEN
      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32, 0xaa),
        nonce: 10n,
        expiry: 1000000n,
        energyAmount: 5000n,
        transactionType: 3,
        payload: Buffer.from([0x01, 0x02, 0x03]),
      };
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = serializeTransaction(transaction, path);

      // THEN
      expect(result.payloads.length).toBeGreaterThan(0);
      expect(result.payloads[0][0]).toBe(5);
    });

    it("should produce multiple payloads for large transaction", () => {
      // GIVEN
      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32),
        nonce: 1n,
        expiry: 1n,
        energyAmount: 1n,
        transactionType: 1,
        payload: Buffer.alloc(300, 0xff),
      };
      const path = "44'/919'";

      // WHEN
      const result = serializeTransaction(transaction, path);

      // THEN
      expect(result.payloads.length).toBeGreaterThan(1);
    });
  });

  describe("serializeTransferWithMemo", () => {
    it("should serialize TransferWithMemo transaction", () => {
      // GIVEN
      const recipient = Buffer.alloc(32, 0xbb);
      const memo = Buffer.from("Test memo");
      const amount = Buffer.alloc(8);
      amount.writeBigUInt64BE(1000000n);

      const payload = Buffer.concat([recipient, Buffer.from([0x00, 0x09]), memo, amount]);

      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32, 0xaa),
        nonce: 5n,
        expiry: 2000000n,
        energyAmount: 10000n,
        transactionType: 22,
        payload,
      };
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = serializeTransferWithMemo(transaction, path);

      // THEN
      expect(result.headerPayload.length).toBeGreaterThan(0);
      expect(result.memoPayloads.length).toBe(1);
      expect(result.memoPayloads[0]).toEqual(memo);
      expect(result.amountPayload).toEqual(amount);
    });

    it("should throw on non-TransferWithMemo type", () => {
      // GIVEN
      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32),
        nonce: 1n,
        expiry: 1n,
        energyAmount: 1n,
        transactionType: 3,
        payload: Buffer.alloc(10),
      };
      const path = "44'/919'/0'/0/0";

      // WHEN & THEN
      expect(() => serializeTransferWithMemo(transaction, path)).toThrow(
        "Transaction must be TransferWithMemo type (22)",
      );
    });

    it("should chunk large memo", () => {
      // GIVEN
      const recipient = Buffer.alloc(32, 0xbb);
      const memo = Buffer.alloc(600, 0xcc);
      const memoLength = Buffer.alloc(2);
      memoLength.writeUInt16BE(600);
      const amount = Buffer.alloc(8);
      amount.writeBigUInt64BE(5000000n);

      const payload = Buffer.concat([recipient, memoLength, memo, amount]);

      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32, 0xaa),
        nonce: 1n,
        expiry: 1n,
        energyAmount: 1n,
        transactionType: 22,
        payload,
      };
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = serializeTransferWithMemo(transaction, path);

      // THEN
      expect(result.memoPayloads.length).toBeGreaterThan(1);
      expect(result.memoPayloads[0].length).toBe(255);
      const reconstructedMemo = Buffer.concat(result.memoPayloads);
      expect(reconstructedMemo).toEqual(memo);
    });

    it("should include correct components in header", () => {
      // GIVEN
      const recipient = Buffer.alloc(32, 0xdd);
      const memo = Buffer.from("Hello");
      const amount = Buffer.alloc(8);
      amount.writeBigUInt64BE(123456n);

      const payload = Buffer.concat([recipient, Buffer.from([0x00, 0x05]), memo, amount]);

      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32, 0xee),
        nonce: 42n,
        expiry: 999999n,
        energyAmount: 7777n,
        transactionType: 22,
        payload,
      };
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = serializeTransferWithMemo(transaction, path);

      // THEN
      const header = result.headerPayload;
      const pathBuffer = pathToBuffer(path);

      expect(header.subarray(0, pathBuffer.length)).toEqual(pathBuffer);

      let offset = pathBuffer.length;
      expect(header.subarray(offset, offset + 32)).toEqual(transaction.sender);
      offset += 32;

      expect(header.readBigUInt64BE(offset)).toBe(42n);
      offset += 8;

      expect(header.readBigUInt64BE(offset)).toBe(7777n);
      offset += 8;

      offset += 4;

      expect(header.readBigUInt64BE(offset)).toBe(999999n);
      offset += 8;

      expect(header[offset]).toBe(22);
      offset += 1;

      expect(header.subarray(offset, offset + 32)).toEqual(recipient);
      offset += 32;

      expect(header.readUInt16BE(offset)).toBe(5);
    });

    it("should handle empty memo", () => {
      // GIVEN
      const recipient = Buffer.alloc(32, 0xff);
      const amount = Buffer.alloc(8);
      amount.writeBigUInt64BE(1n);

      const payload = Buffer.concat([recipient, Buffer.from([0x00, 0x00]), amount]);

      const transaction: AccountTransaction = {
        sender: Buffer.alloc(32),
        nonce: 1n,
        expiry: 1n,
        energyAmount: 1n,
        transactionType: 22,
        payload,
      };
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = serializeTransferWithMemo(transaction, path);

      // THEN
      expect(result.memoPayloads.length).toBe(0);
      expect(result.headerPayload.length).toBeGreaterThan(0);
      expect(result.amountPayload.length).toBe(8);
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
});
