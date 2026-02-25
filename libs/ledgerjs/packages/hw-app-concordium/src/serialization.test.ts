import {
  TransactionType,
  pathToBuffer,
  serializeTransfer,
  serializeTransferWithMemo,
  AccountAddress,
} from "@ledgerhq/concordium-core";
import type { Transaction } from "@ledgerhq/concordium-core";
import type { CredentialDeploymentTransaction } from "@ledgerhq/concordium-core";
import {
  serializeTransactionPayloads,
  prepareTransferAPDU,
  prepareTransferWithMemoAPDU,
  serializeCredentialDeployment,
} from "./serialization";

describe("serialization", () => {
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
      const largeSerialized = Buffer.concat([
        serialized,
        Buffer.alloc(300, 0xaa), // Add extra data to force chunking
      ]);
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = prepareTransferAPDU(largeSerialized, path);

      // THEN
      expect(result.length).toBeGreaterThan(1); // Multiple chunks
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
      expect(result[0].length).toBeGreaterThan(result[1].length);
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

    it("should throw error for buffer missing memo_length bytes (94 bytes, minLength=95)", () => {
      // GIVEN - 94-byte buffer: passes sender/nonce/energy/payloadSize/expiry/type/recipient
      // but is 1 byte short of the 95-byte minimum (which includes 2 bytes for memo_length)
      const truncatedBuffer = Buffer.alloc(94);
      const path = "44'/919'/0'/0/0";

      // WHEN/THEN
      expect(() => prepareTransferWithMemoAPDU(truncatedBuffer, path)).toThrow(
        "Invalid TransferWithMemo buffer: expected at least 95 bytes, got 94",
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

  describe("serializeCredentialDeployment", () => {
    const PATH = "44'/919'/0'/0/0";

    const minimalTx: CredentialDeploymentTransaction = {
      credentialPublicKeys: {
        keys: {
          "0": { schemeId: "Ed25519", verifyKey: "a".repeat(64) },
        },
        threshold: 1,
      },
      credId: "b".repeat(96),
      ipIdentity: 0,
      revocationThreshold: 2,
      arData: {
        "1": { encIdCredPubShare: "cc".repeat(96) },
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

    it("should return structured APDU components", () => {
      // WHEN
      const result = serializeCredentialDeployment(minimalTx, PATH);

      // THEN
      expect(Buffer.isBuffer(result.payloadDerivationPath)).toBe(true);
      expect(Buffer.isBuffer(result.numberOfVerificationKeys)).toBe(true);
      expect(Array.isArray(result.verificationKeys)).toBe(true);
      expect(Buffer.isBuffer(result.thresholdAndRegIdAndIPIdentity)).toBe(true);
      expect(Array.isArray(result.encIdCredPubShareAndKey)).toBe(true);
      expect(Buffer.isBuffer(result.validToAndCreatedAtAndAttributesLength)).toBe(true);
      expect(Array.isArray(result.tag)).toBe(true);
      expect(Array.isArray(result.valueLength)).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
      expect(Buffer.isBuffer(result.proofLength)).toBe(true);
      expect(Buffer.isBuffer(result.proofs)).toBe(true);
      expect(Buffer.isBuffer(result.newOrExistingPayload)).toBe(true);
    });

    it("should encode derivation path correctly", () => {
      // WHEN
      const result = serializeCredentialDeployment(minimalTx, PATH);

      // THEN - path buffer matches pathToBuffer output
      expect(result.payloadDerivationPath).toEqual(pathToBuffer(PATH));
    });

    it("should encode key count correctly", () => {
      // WHEN
      const result = serializeCredentialDeployment(minimalTx, PATH);

      // THEN - 1 key
      expect(result.numberOfVerificationKeys.readUInt8(0)).toBe(1);
      expect(result.verificationKeys.length).toBe(1);
    });

    it("should encode multiple verification keys", () => {
      // GIVEN
      const tx: CredentialDeploymentTransaction = {
        ...minimalTx,
        credentialPublicKeys: {
          keys: {
            "0": { schemeId: "Ed25519", verifyKey: "11".repeat(32) },
            "1": { schemeId: "Ed25519", verifyKey: "22".repeat(32) },
          },
          threshold: 2,
        },
      };

      // WHEN
      const result = serializeCredentialDeployment(tx, PATH);

      // THEN
      expect(result.numberOfVerificationKeys.readUInt8(0)).toBe(2);
      expect(result.verificationKeys.length).toBe(2);
    });

    it("should encode AR data entries correctly", () => {
      // WHEN
      const result = serializeCredentialDeployment(minimalTx, PATH);

      // THEN - 1 AR data entry
      expect(result.encIdCredPubShareAndKey.length).toBe(1);
    });

    it("should encode attributes correctly", () => {
      // GIVEN
      const tx: CredentialDeploymentTransaction = {
        ...minimalTx,
        policy: {
          ...minimalTx.policy,
          revealedAttributes: { "0": "test", "1": "value" },
        },
      };

      // WHEN
      const result = serializeCredentialDeployment(tx, PATH);

      // THEN - 2 attributes
      expect(result.tag.length).toBe(2);
      expect(result.valueLength.length).toBe(2);
      expect(result.value.length).toBe(2);
    });

    it("should encode proof length as 4-byte big-endian", () => {
      // WHEN
      const result = serializeCredentialDeployment(minimalTx, PATH);

      // THEN - proofLength is 4 bytes and matches actual proofs length
      expect(result.proofLength.length).toBe(4);
      expect(result.proofLength.readUInt32BE(0)).toBe(result.proofs.length);
    });

    it("should encode newOrExistingPayload as [0x00] + expiry", () => {
      // WHEN
      const result = serializeCredentialDeployment(minimalTx, PATH);

      // THEN - first byte is 0x00 (new account), followed by 8-byte expiry
      expect(result.newOrExistingPayload[0]).toBe(0x00);
      expect(result.newOrExistingPayload.length).toBe(9);
    });
  });
});
