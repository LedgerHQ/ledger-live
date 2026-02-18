import {
  encodeWord8,
  encodeWord16,
  encodeWord32,
  encodeWord64,
  encodeWord8FromString,
  serializeMap,
  serializeVerifyKey,
  serializeYearMonth,
  pathToBuffer,
  chunkBuffer,
} from "./utils";
import { serializeIdOwnershipProofs, serializeAccountOwnershipProofs } from "./serialization";

describe("utils", () => {
  describe("encodeWord8", () => {
    it("should encode 0", () => {
      // GIVEN
      const value = 0;

      // WHEN
      const result = encodeWord8(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00]));
    });

    it("should encode 127", () => {
      // GIVEN
      const value = 127;

      // WHEN
      const result = encodeWord8(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x7f]));
    });

    it("should encode 255", () => {
      // GIVEN
      const value = 255;

      // WHEN
      const result = encodeWord8(value);

      // THEN
      expect(result).toEqual(Buffer.from([0xff]));
    });

    it("should throw on value > 255", () => {
      // GIVEN
      const value = 256;

      // WHEN & THEN
      expect(() => encodeWord8(value)).toThrow(
        "The input has to be a 8 bit unsigned integer but it was: 256",
      );
    });

    it("should throw on negative value", () => {
      // GIVEN
      const value = -1;

      // WHEN & THEN
      expect(() => encodeWord8(value)).toThrow(
        "The input has to be a 8 bit unsigned integer but it was: -1",
      );
    });

    it("should throw on non-integer value", () => {
      // GIVEN
      const value = 1.5;

      // WHEN & THEN
      expect(() => encodeWord8(value)).toThrow(
        "The input has to be a 8 bit unsigned integer but it was: 1.5",
      );
    });
  });

  describe("encodeWord16", () => {
    it("should encode 0 in big-endian", () => {
      // GIVEN
      const value = 0;

      // WHEN
      const result = encodeWord16(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x00]));
    });

    it("should encode 255 in big-endian", () => {
      // GIVEN
      const value = 255;

      // WHEN
      const result = encodeWord16(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0xff]));
    });

    it("should encode 256 in big-endian", () => {
      // GIVEN
      const value = 256;

      // WHEN
      const result = encodeWord16(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x01, 0x00]));
    });

    it("should encode 65535 in big-endian", () => {
      // GIVEN
      const value = 65535;

      // WHEN
      const result = encodeWord16(value);

      // THEN
      expect(result).toEqual(Buffer.from([0xff, 0xff]));
    });

    it("should encode 256 in little-endian", () => {
      // GIVEN
      const value = 256;

      // WHEN
      const result = encodeWord16(value, true);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x01]));
    });

    it("should throw on value > 65535", () => {
      // GIVEN
      const value = 65536;

      // WHEN & THEN
      expect(() => encodeWord16(value)).toThrow(
        "The input has to be a 16 bit unsigned integer but it was: 65536",
      );
    });

    it("should throw on negative value", () => {
      // GIVEN
      const value = -1;

      // WHEN & THEN
      expect(() => encodeWord16(value)).toThrow(
        "The input has to be a 16 bit unsigned integer but it was: -1",
      );
    });

    it("should throw on non-integer value", () => {
      // GIVEN
      const value = 100.5;

      // WHEN & THEN
      expect(() => encodeWord16(value)).toThrow(
        "The input has to be a 16 bit unsigned integer but it was: 100.5",
      );
    });
  });

  describe("encodeWord32", () => {
    it("should encode 0 in big-endian", () => {
      // GIVEN
      const value = 0;

      // WHEN
      const result = encodeWord32(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x00, 0x00, 0x00]));
    });

    it("should encode 255 in big-endian", () => {
      // GIVEN
      const value = 255;

      // WHEN
      const result = encodeWord32(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x00, 0x00, 0xff]));
    });

    it("should encode 65536 in big-endian", () => {
      // GIVEN
      const value = 65536;

      // WHEN
      const result = encodeWord32(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x01, 0x00, 0x00]));
    });

    it("should encode 4294967295 in big-endian", () => {
      // GIVEN
      const value = 4294967295;

      // WHEN
      const result = encodeWord32(value);

      // THEN
      expect(result).toEqual(Buffer.from([0xff, 0xff, 0xff, 0xff]));
    });

    it("should encode 65536 in little-endian", () => {
      // GIVEN
      const value = 65536;

      // WHEN
      const result = encodeWord32(value, true);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x00, 0x01, 0x00]));
    });

    it("should throw on value > 4294967295", () => {
      // GIVEN
      const value = 4294967296;

      // WHEN & THEN
      expect(() => encodeWord32(value)).toThrow(
        "The input has to be a 32 bit unsigned integer but it was: 4294967296",
      );
    });

    it("should throw on negative value", () => {
      // GIVEN
      const value = -1;

      // WHEN & THEN
      expect(() => encodeWord32(value)).toThrow(
        "The input has to be a 32 bit unsigned integer but it was: -1",
      );
    });

    it("should throw on non-integer value", () => {
      // GIVEN
      const value = 1000.75;

      // WHEN & THEN
      expect(() => encodeWord32(value)).toThrow(
        "The input has to be a 32 bit unsigned integer but it was: 1000.75",
      );
    });
  });

  describe("encodeWord64", () => {
    it("should encode 0n in big-endian", () => {
      // GIVEN
      const value = 0n;

      // WHEN
      const result = encodeWord64(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
    });

    it("should encode 255n in big-endian", () => {
      // GIVEN
      const value = 255n;

      // WHEN
      const result = encodeWord64(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff]));
    });

    it("should encode 4294967296n in big-endian", () => {
      // GIVEN
      const value = 4294967296n;

      // WHEN
      const result = encodeWord64(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));
    });

    it("should encode max 64-bit value in big-endian", () => {
      // GIVEN
      const value = 18446744073709551615n;

      // WHEN
      const result = encodeWord64(value);

      // THEN
      expect(result).toEqual(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
    });

    it("should encode 256n in little-endian", () => {
      // GIVEN
      const value = 256n;

      // WHEN
      const result = encodeWord64(value, true);

      // THEN
      expect(result).toEqual(Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
    });

    it("should throw on value > max 64-bit", () => {
      // GIVEN
      const value = 18446744073709551616n;

      // WHEN & THEN
      expect(() => encodeWord64(value)).toThrow(
        "The input has to be a 64 bit unsigned integer but it was: 18446744073709551616",
      );
    });

    it("should throw on negative value", () => {
      // GIVEN
      const value = -1n;

      // WHEN & THEN
      expect(() => encodeWord64(value)).toThrow(
        "The input has to be a 64 bit unsigned integer but it was: -1",
      );
    });
  });

  describe("encodeWord8FromString", () => {
    it("should encode '0'", () => {
      // GIVEN
      const value = "0";

      // WHEN
      const result = encodeWord8FromString(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00]));
    });

    it("should encode '128'", () => {
      // GIVEN
      const value = "128";

      // WHEN
      const result = encodeWord8FromString(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x80]));
    });

    it("should encode '255'", () => {
      // GIVEN
      const value = "255";

      // WHEN
      const result = encodeWord8FromString(value);

      // THEN
      expect(result).toEqual(Buffer.from([0xff]));
    });

    it("should throw on '256'", () => {
      // GIVEN
      const value = "256";

      // WHEN & THEN
      expect(() => encodeWord8FromString(value)).toThrow(
        "The input has to be a 8 bit unsigned integer but it was: 256",
      );
    });

    it("should throw on non-numeric string", () => {
      // GIVEN
      const value = "abc";

      // WHEN & THEN
      expect(() => encodeWord8FromString(value)).toThrow(
        "The input has to be a 8 bit unsigned integer but it was: NaN",
      );
    });

    it("should encode empty string as 0", () => {
      // GIVEN
      const value = "";

      // WHEN
      const result = encodeWord8FromString(value);

      // THEN
      expect(result).toEqual(Buffer.from([0x00]));
    });
  });

  describe("serializeVerifyKey", () => {
    it("should serialize Ed25519 key", () => {
      // GIVEN
      const key = {
        schemeId: "Ed25519",
        verifyKey: "a".repeat(64),
      };

      // WHEN
      const result = serializeVerifyKey(key);

      // THEN
      expect(result.length).toBe(33);
      expect(result[0]).toBe(0x00);
      expect(result.subarray(1).toString("hex")).toBe("a".repeat(64));
    });

    it("should throw on unknown scheme", () => {
      // GIVEN
      const key = {
        schemeId: "UnknownScheme",
        verifyKey: "a".repeat(64),
      };

      // WHEN & THEN
      expect(() => serializeVerifyKey(key)).toThrow("Unknown key type: UnknownScheme");
    });

    it("should handle 32-byte hex key correctly", () => {
      // GIVEN
      const key = {
        schemeId: "Ed25519",
        verifyKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      };

      // WHEN
      const result = serializeVerifyKey(key);

      // THEN
      expect(result.length).toBe(33);
      expect(result[0]).toBe(0x00);
      expect(result.subarray(1).toString("hex")).toBe(
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      );
    });
  });

  describe("serializeYearMonth", () => {
    it("should serialize 202401", () => {
      // GIVEN
      const yearMonth = "202401";

      // WHEN
      const result = serializeYearMonth(yearMonth);

      // THEN
      expect(result.length).toBe(3);
      expect(result.readUInt16BE(0)).toBe(2024);
      expect(result.readUInt8(2)).toBe(1);
    });

    it("should serialize 209912", () => {
      // GIVEN
      const yearMonth = "209912";

      // WHEN
      const result = serializeYearMonth(yearMonth);

      // THEN
      expect(result.length).toBe(3);
      expect(result.readUInt16BE(0)).toBe(2099);
      expect(result.readUInt8(2)).toBe(12);
    });

    it("should serialize 197001", () => {
      // GIVEN
      const yearMonth = "197001";

      // WHEN
      const result = serializeYearMonth(yearMonth);

      // THEN
      expect(result.length).toBe(3);
      expect(result.readUInt16BE(0)).toBe(1970);
      expect(result.readUInt8(2)).toBe(1);
    });

    it("should handle middle months", () => {
      // GIVEN
      const yearMonth = "202406";

      // WHEN
      const result = serializeYearMonth(yearMonth);

      // THEN
      expect(result.length).toBe(3);
      expect(result.readUInt16BE(0)).toBe(2024);
      expect(result.readUInt8(2)).toBe(6);
    });

    it("should throw on invalid length (too short)", () => {
      // GIVEN
      const yearMonth = "20240";

      // WHEN & THEN
      expect(() => serializeYearMonth(yearMonth)).toThrow(
        "Invalid yearMonth format: expected 6 characters (YYYYMM), got 5",
      );
    });

    it("should throw on invalid length (too long)", () => {
      // GIVEN
      const yearMonth = "2024011";

      // WHEN & THEN
      expect(() => serializeYearMonth(yearMonth)).toThrow(
        "Invalid yearMonth format: expected 6 characters (YYYYMM), got 7",
      );
    });

    it("should throw on non-numeric input", () => {
      // GIVEN
      const yearMonth = "20XX01";

      // WHEN & THEN
      expect(() => serializeYearMonth(yearMonth)).toThrow(
        'Invalid yearMonth format: "20XX01" could not be parsed',
      );
    });

    it("should throw on invalid month (0)", () => {
      // GIVEN
      const yearMonth = "202400";

      // WHEN & THEN
      expect(() => serializeYearMonth(yearMonth)).toThrow(
        "Invalid month: 0 (must be between 1 and 12)",
      );
    });

    it("should throw on invalid month (13)", () => {
      // GIVEN
      const yearMonth = "202413";

      // WHEN & THEN
      expect(() => serializeYearMonth(yearMonth)).toThrow(
        "Invalid month: 13 (must be between 1 and 12)",
      );
    });
  });

  describe("serializeMap", () => {
    it("should serialize empty map", () => {
      // GIVEN
      const map = {};

      // WHEN
      const result = serializeMap(map, encodeWord8, encodeWord8FromString, encodeWord8);

      // THEN
      expect(result).toEqual(Buffer.from([0x00]));
    });

    it("should serialize single-entry map", () => {
      // GIVEN
      const map = { "0": 42 };

      // WHEN
      const result = serializeMap(map, encodeWord8, encodeWord8FromString, encodeWord8);

      // THEN
      expect(result).toEqual(Buffer.from([0x01, 0x00, 0x2a]));
    });

    it("should serialize multi-entry map", () => {
      // GIVEN
      const map = { "0": 10, "1": 20, "2": 30 };

      // WHEN
      const result = serializeMap(map, encodeWord8, encodeWord8FromString, encodeWord8);

      // THEN
      expect(result.length).toBe(1 + 3 * 2);
      expect(result[0]).toBe(3);
    });

    it("should use custom encoders correctly", () => {
      // GIVEN
      const map = { a: { schemeId: "Ed25519", verifyKey: "ff".repeat(32) } };

      // WHEN
      const result = serializeMap(
        map,
        encodeWord16,
        key => Buffer.from(key, "utf-8"),
        serializeVerifyKey,
      );

      // THEN
      expect(result[0]).toBe(0x00);
      expect(result[1]).toBe(0x01);
    });
  });

  describe("serializeIdOwnershipProofs", () => {
    it("should serialize proofs with empty proofIdCredPub", () => {
      // GIVEN
      const proofs = {
        sig: "aa".repeat(64),
        commitments: "bb".repeat(48),
        challenge: "cc".repeat(32),
        proofIdCredPub: {},
        proofIpSig: "dd".repeat(32),
        proofRegId: "ee".repeat(32),
        credCounterLessThanMaxAccounts: "ff".repeat(32),
      };

      // WHEN
      const result = serializeIdOwnershipProofs(proofs);

      // THEN
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.subarray(0, 64).toString("hex")).toBe("aa".repeat(64));
      expect(result.subarray(64, 112).toString("hex")).toBe("bb".repeat(48));
      expect(result.subarray(112, 144).toString("hex")).toBe("cc".repeat(32));
    });

    it("should serialize proofs with single proofIdCredPub entry", () => {
      // GIVEN
      const proofs = {
        sig: "aa".repeat(64),
        commitments: "bb".repeat(48),
        challenge: "cc".repeat(32),
        proofIdCredPub: {
          "0": "11".repeat(64),
        },
        proofIpSig: "dd".repeat(32),
        proofRegId: "ee".repeat(32),
        credCounterLessThanMaxAccounts: "ff".repeat(32),
      };

      // WHEN
      const result = serializeIdOwnershipProofs(proofs);

      // THEN
      expect(Buffer.isBuffer(result)).toBe(true);
      const lengthOffset = 64 + 48 + 32;
      expect(result.readUInt32BE(lengthOffset)).toBe(1);
    });

    it("should sort proofIdCredPub entries by index", () => {
      // GIVEN
      const proofs = {
        sig: "aa".repeat(64),
        commitments: "bb".repeat(48),
        challenge: "cc".repeat(32),
        proofIdCredPub: {
          "2": "22".repeat(64),
          "0": "00".repeat(64),
          "1": "11".repeat(64),
        },
        proofIpSig: "dd".repeat(32),
        proofRegId: "ee".repeat(32),
        credCounterLessThanMaxAccounts: "ff".repeat(32),
      };

      // WHEN
      const result = serializeIdOwnershipProofs(proofs);

      // THEN
      expect(Buffer.isBuffer(result)).toBe(true);
      const lengthOffset = 64 + 48 + 32;
      expect(result.readUInt32BE(lengthOffset)).toBe(3);
      expect(result.readUInt32BE(lengthOffset + 4)).toBe(0);
      expect(result.subarray(lengthOffset + 8, lengthOffset + 72).toString("hex")).toBe(
        "00".repeat(64),
      );
      expect(result.readUInt32BE(lengthOffset + 72)).toBe(1);
    });

    it("should include all proof components in correct order", () => {
      // GIVEN
      const proofs = {
        sig: "aa".repeat(64),
        commitments: "bb".repeat(48),
        challenge: "cc".repeat(32),
        proofIdCredPub: {},
        proofIpSig: "dd".repeat(32),
        proofRegId: "ee".repeat(32),
        credCounterLessThanMaxAccounts: "ff".repeat(32),
      };

      // WHEN
      const result = serializeIdOwnershipProofs(proofs);

      // THEN
      expect(Buffer.isBuffer(result)).toBe(true);
      let offset = 0;

      expect(result.subarray(offset, offset + 64).toString("hex")).toBe("aa".repeat(64));
      offset += 64;

      expect(result.subarray(offset, offset + 48).toString("hex")).toBe("bb".repeat(48));
      offset += 48;

      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("cc".repeat(32));
      offset += 32;

      expect(result.readUInt32BE(offset)).toBe(0);
      offset += 4;

      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("dd".repeat(32));
      offset += 32;

      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("ee".repeat(32));
      offset += 32;

      expect(result.subarray(offset, offset + 32).toString("hex")).toBe("ff".repeat(32));
    });
  });

  describe("serializeAccountOwnershipProofs", () => {
    it("should serialize single signature", () => {
      // GIVEN
      const signatures = ["aa".repeat(64)];

      // WHEN
      const result = serializeAccountOwnershipProofs(signatures);

      // THEN
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result[0]).toBe(1); // Number of signatures
      expect(result[1]).toBe(0); // Key index 0
      expect(result.subarray(2, 66).toString("hex")).toBe("aa".repeat(64));
      expect(result.length).toBe(1 + 1 + 64); // count + (index + signature)
    });

    it("should serialize multiple signatures", () => {
      // GIVEN
      const signatures = ["aa".repeat(64), "bb".repeat(64), "cc".repeat(64)];

      // WHEN
      const result = serializeAccountOwnershipProofs(signatures);

      // THEN
      expect(result[0]).toBe(3); // Number of signatures
      expect(result[1]).toBe(0); // First key index
      expect(result.subarray(2, 66).toString("hex")).toBe("aa".repeat(64));
      expect(result[66]).toBe(1); // Second key index
      expect(result.subarray(67, 131).toString("hex")).toBe("bb".repeat(64));
      expect(result[131]).toBe(2); // Third key index
      expect(result.subarray(132, 196).toString("hex")).toBe("cc".repeat(64));
      expect(result.length).toBe(1 + 3 * (1 + 64));
    });

    it("should throw on invalid signature length (too short)", () => {
      // GIVEN
      const signatures = ["aa".repeat(32)]; // Only 32 bytes instead of 64

      // WHEN & THEN
      expect(() => serializeAccountOwnershipProofs(signatures)).toThrow(
        "Invalid signature length at index 0: expected 64 bytes, got 32",
      );
    });

    it("should throw on invalid signature length (too long)", () => {
      // GIVEN
      const signatures = ["aa".repeat(80)]; // 80 bytes instead of 64

      // WHEN & THEN
      expect(() => serializeAccountOwnershipProofs(signatures)).toThrow(
        "Invalid signature length at index 0: expected 64 bytes, got 80",
      );
    });

    it("should throw on invalid signature in multi-signature array", () => {
      // GIVEN
      const signatures = ["aa".repeat(64), "bb".repeat(32), "cc".repeat(64)];

      // WHEN & THEN
      expect(() => serializeAccountOwnershipProofs(signatures)).toThrow(
        "Invalid signature length at index 1: expected 64 bytes, got 32",
      );
    });

    it("should handle empty signatures array", () => {
      // GIVEN
      const signatures: string[] = [];

      // WHEN
      const result = serializeAccountOwnershipProofs(signatures);

      // THEN
      expect(result[0]).toBe(0); // Zero signatures
      expect(result.length).toBe(1);
    });

    it("should correctly index signatures sequentially", () => {
      // GIVEN
      const signatures = ["11".repeat(64), "22".repeat(64)];

      // WHEN
      const result = serializeAccountOwnershipProofs(signatures);

      // THEN
      expect(result[0]).toBe(2);
      expect(result[1]).toBe(0); // First index
      expect(result[66]).toBe(1); // Second index
    });
  });

  describe("pathToBuffer", () => {
    it("should serialize standard Concordium path", () => {
      // GIVEN
      const path = "44'/919'/0'/0/0";

      // WHEN
      const result = pathToBuffer(path);

      // THEN
      expect(result[0]).toBe(5); // Path length
      expect(result.readUInt32BE(1)).toBe(0x8000002c); // 44'
      expect(result.readUInt32BE(5)).toBe(0x80000397); // 919'
      expect(result.readUInt32BE(9)).toBe(0x80000000); // 0'
      expect(result.readUInt32BE(13)).toBe(0); // 0
      expect(result.readUInt32BE(17)).toBe(0); // 0
      expect(result.length).toBe(21); // 1 + 5*4
    });

    it("should serialize short path", () => {
      // GIVEN
      const path = "44'/919'";

      // WHEN
      const result = pathToBuffer(path);

      // THEN
      expect(result[0]).toBe(2);
      expect(result.length).toBe(9); // 1 + 2*4
    });

    it("should handle path with m/ prefix", () => {
      // GIVEN
      const path = "m/44'/919'/0'";

      // WHEN
      const result = pathToBuffer(path);

      // THEN
      expect(result[0]).toBe(3);
      expect(result.length).toBe(13); // 1 + 3*4
    });

    it("should handle non-hardened indices", () => {
      // GIVEN
      const path = "44'/919'/0/1/2";

      // WHEN
      const result = pathToBuffer(path);

      // THEN
      expect(result[0]).toBe(5);
      expect(result.readUInt32BE(9)).toBe(0); // Non-hardened
      expect(result.readUInt32BE(13)).toBe(1);
      expect(result.readUInt32BE(17)).toBe(2);
    });
  });

  describe("chunkBuffer", () => {
    it("should handle buffer smaller than chunk size", () => {
      // GIVEN
      const buffer = Buffer.alloc(100, 0xaa);
      const maxSize = 255;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(buffer);
    });

    it("should handle buffer exactly at chunk size", () => {
      // GIVEN
      const buffer = Buffer.alloc(255, 0xaa);
      const maxSize = 255;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(255);
    });

    it("should split buffer larger than chunk size", () => {
      // GIVEN
      const buffer = Buffer.alloc(300, 0xaa);
      const maxSize = 255;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(255);
      expect(result[1].length).toBe(45);
    });

    it("should handle buffer exactly twice the chunk size", () => {
      // GIVEN
      const buffer = Buffer.alloc(510, 0xbb);
      const maxSize = 255;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(255);
      expect(result[1].length).toBe(255);
    });

    it("should handle multiple full chunks with remainder", () => {
      // GIVEN
      const buffer = Buffer.alloc(600, 0xcc);
      const maxSize = 255;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(3);
      expect(result[0].length).toBe(255);
      expect(result[1].length).toBe(255);
      expect(result[2].length).toBe(90);
    });

    it("should preserve data integrity across chunks", () => {
      // GIVEN
      const buffer = Buffer.from([...Array(300).keys()].map(i => i % 256));
      const maxSize = 255;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      const reconstructed = Buffer.concat(result);
      expect(reconstructed).toEqual(buffer);
    });

    it("should handle empty buffer", () => {
      // GIVEN
      const buffer = Buffer.alloc(0);
      const maxSize = 255;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(0);
    });

    it("should handle custom chunk sizes", () => {
      // GIVEN
      const buffer = Buffer.alloc(100, 0xdd);
      const maxSize = 25;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(4);
      expect(result[0].length).toBe(25);
      expect(result[1].length).toBe(25);
      expect(result[2].length).toBe(25);
      expect(result[3].length).toBe(25);
    });

    it("should handle chunk size of 1", () => {
      // GIVEN
      const buffer = Buffer.from([0x01, 0x02, 0x03]);
      const maxSize = 1;

      // WHEN
      const result = chunkBuffer(buffer, maxSize);

      // THEN
      expect(result.length).toBe(3);
      expect(result[0]).toEqual(Buffer.from([0x01]));
      expect(result[1]).toEqual(Buffer.from([0x02]));
      expect(result[2]).toEqual(Buffer.from([0x03]));
    });

    it("should throw error for maxSize of 0", () => {
      // GIVEN
      const buffer = Buffer.alloc(100, 0xaa);
      const maxSize = 0;

      // WHEN/THEN
      expect(() => chunkBuffer(buffer, maxSize)).toThrow("maxSize must be positive, got 0");
    });

    it("should throw error for negative maxSize", () => {
      // GIVEN
      const buffer = Buffer.alloc(100, 0xaa);
      const maxSize = -10;

      // WHEN/THEN
      expect(() => chunkBuffer(buffer, maxSize)).toThrow("maxSize must be positive, got -10");
    });
  });
});
