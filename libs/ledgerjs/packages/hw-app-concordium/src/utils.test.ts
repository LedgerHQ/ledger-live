import {
  encodeWord8,
  encodeWord16,
  encodeWord32,
  encodeWord64,
  encodeWord8FromString,
  serializeVerifyKey,
  serializeYearMonth,
  serializeMap,
  serializeIdOwnershipProofs,
} from "./utils";

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
      expect(typeof result).toBe("string");
      const buffer = Buffer.from(result, "hex");
      expect(buffer.subarray(0, 64).toString("hex")).toBe("aa".repeat(64));
      expect(buffer.subarray(64, 112).toString("hex")).toBe("bb".repeat(48));
      expect(buffer.subarray(112, 144).toString("hex")).toBe("cc".repeat(32));
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
      expect(typeof result).toBe("string");
      const buffer = Buffer.from(result, "hex");
      const lengthOffset = 64 + 48 + 32;
      expect(buffer.readUInt32BE(lengthOffset)).toBe(1);
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
      const buffer = Buffer.from(result, "hex");
      const lengthOffset = 64 + 48 + 32;
      expect(buffer.readUInt32BE(lengthOffset)).toBe(3);
      expect(buffer.readUInt32BE(lengthOffset + 4)).toBe(0);
      expect(buffer.subarray(lengthOffset + 8, lengthOffset + 72).toString("hex")).toBe(
        "00".repeat(64),
      );
      expect(buffer.readUInt32BE(lengthOffset + 72)).toBe(1);
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
      const buffer = Buffer.from(result, "hex");
      let offset = 0;

      expect(buffer.subarray(offset, offset + 64).toString("hex")).toBe("aa".repeat(64));
      offset += 64;

      expect(buffer.subarray(offset, offset + 48).toString("hex")).toBe("bb".repeat(48));
      offset += 48;

      expect(buffer.subarray(offset, offset + 32).toString("hex")).toBe("cc".repeat(32));
      offset += 32;

      expect(buffer.readUInt32BE(offset)).toBe(0);
      offset += 4;

      expect(buffer.subarray(offset, offset + 32).toString("hex")).toBe("dd".repeat(32));
      offset += 32;

      expect(buffer.subarray(offset, offset + 32).toString("hex")).toBe("ee".repeat(32));
      offset += 32;

      expect(buffer.subarray(offset, offset + 32).toString("hex")).toBe("ff".repeat(32));
    });
  });
});
