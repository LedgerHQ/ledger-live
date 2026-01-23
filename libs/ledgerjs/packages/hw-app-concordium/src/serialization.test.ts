import {
  pathToBuffer,
  serializeAccountTransaction,
  serializeTransaction,
  serializeTransactionPayloads,
  serializeTransactionPayloadsWithDerivationPath,
  serializeTransferWithMemo,
} from "./serialization";
import type { AccountTransaction } from "./types";

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
});
