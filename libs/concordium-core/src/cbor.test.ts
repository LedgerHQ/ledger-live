import {
  decodeMemoFromCbor,
  encodeCborArray,
  encodeCborByteString,
  encodeCborInteger,
  encodeCborMap,
  encodeCborMapDeterministic,
  encodeCborNegative,
  encodeCborTag,
  encodeCborTextString,
  encodeCborUnsigned,
  encodeMemoToCbor,
  memoEncodedSize,
} from "./cbor";

describe("CBOR memo encoding/decoding", () => {
  describe("encodeMemoToCbor", () => {
    it("should encode empty string (short form)", () => {
      const result = encodeMemoToCbor("");
      expect(result).toEqual(Buffer.from([0x60]));
    });

    it("should encode short memo (0-23 bytes, short form)", () => {
      const memo = "Hello";
      const result = encodeMemoToCbor(memo);
      const expected = Buffer.concat([Buffer.from([0x60 + 5]), Buffer.from(memo, "utf-8")]);
      expect(result).toEqual(expected);
    });

    it("should encode 23-byte memo (max short form)", () => {
      const memo = "a".repeat(23);
      const result = encodeMemoToCbor(memo);
      const expected = Buffer.concat([Buffer.from([0x60 + 23]), Buffer.from(memo, "utf-8")]);
      expect(result).toEqual(expected);
    });

    it("should encode 24-byte memo (1-byte length form)", () => {
      const memo = "a".repeat(24);
      const result = encodeMemoToCbor(memo);
      const expected = Buffer.concat([Buffer.from([0x78, 24]), Buffer.from(memo, "utf-8")]);
      expect(result).toEqual(expected);
    });

    it("should encode 100-byte memo (1-byte length form)", () => {
      const memo = "a".repeat(100);
      const result = encodeMemoToCbor(memo);
      const expected = Buffer.concat([Buffer.from([0x78, 100]), Buffer.from(memo, "utf-8")]);
      expect(result).toEqual(expected);
    });

    it("should encode 254-byte memo (max supported length)", () => {
      const memo = "a".repeat(254);
      const result = encodeMemoToCbor(memo);
      const expected = Buffer.concat([Buffer.from([0x78, 254]), Buffer.from(memo, "utf-8")]);
      expect(result).toEqual(expected);
    });

    it("should encode UTF-8 characters correctly", () => {
      const memo = "Hello 世界 🌍";
      const result = encodeMemoToCbor(memo);
      const memoBytes = Buffer.from(memo, "utf-8");
      const expectedLength = memoBytes.length;

      if (expectedLength < 24) {
        expect(result[0]).toBe(0x60 + expectedLength);
        expect(result.subarray(1)).toEqual(memoBytes);
      } else if (expectedLength <= 255) {
        expect(result[0]).toBe(0x78);
        expect(result[1]).toBe(expectedLength);
        expect(result.subarray(2)).toEqual(memoBytes);
      }
    });

    it("should throw error for memo > 254 bytes", () => {
      const memo = "a".repeat(255);
      expect(() => encodeMemoToCbor(memo)).toThrow(
        "Memo length 255 exceeds maximum of 254 bytes (UTF-8)",
      );
    });
  });

  describe("decodeMemoFromCbor", () => {
    it("should decode empty string (short form)", () => {
      const encoded = Buffer.from([0x60]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe("");
    });

    it("should decode short memo (0-23 bytes, short form)", () => {
      const memo = "Hello";
      const encoded = Buffer.concat([Buffer.from([0x60 + 5]), Buffer.from(memo, "utf-8")]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe(memo);
    });

    it("should decode 23-byte memo (max short form)", () => {
      const memo = "a".repeat(23);
      const encoded = Buffer.concat([Buffer.from([0x60 + 23]), Buffer.from(memo, "utf-8")]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe(memo);
    });

    it("should decode 24-byte memo (1-byte length form)", () => {
      const memo = "a".repeat(24);
      const encoded = Buffer.concat([Buffer.from([0x78, 24]), Buffer.from(memo, "utf-8")]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe(memo);
    });

    it("should decode 100-byte memo (1-byte length form)", () => {
      const memo = "a".repeat(100);
      const encoded = Buffer.concat([Buffer.from([0x78, 100]), Buffer.from(memo, "utf-8")]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe(memo);
    });

    it("should decode 254-byte memo (max supported for sending)", () => {
      const memo = "a".repeat(254);
      const encoded = Buffer.concat([Buffer.from([0x78, 254]), Buffer.from(memo, "utf-8")]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe(memo);
    });

    it("should decode 256-byte memo from network (2-byte length form)", () => {
      const memo = "a".repeat(256);
      const encoded = Buffer.concat([Buffer.from([0x79, 0x01, 0x00]), Buffer.from(memo, "utf-8")]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe(memo);
    });

    it("should decode UTF-8 characters correctly", () => {
      const memo = "Hello 世界 🌍";
      const memoBytes = Buffer.from(memo, "utf-8");
      const encoded = Buffer.concat([Buffer.from([0x78, memoBytes.length]), memoBytes]);
      const result = decodeMemoFromCbor(encoded);
      expect(result).toBe(memo);
    });

    it("should decode from hex string (after conversion to Buffer)", () => {
      const memo = "Hello";
      const encoded = Buffer.concat([Buffer.from([0x60 + 5]), Buffer.from(memo, "utf-8")]);
      const hexString = encoded.toString("hex");
      const result = decodeMemoFromCbor(Buffer.from(hexString, "hex"));
      expect(result).toBe(memo);
    });

    it("should decode from base64 string (after conversion to Buffer)", () => {
      const memo = "Hello";
      const encoded = Buffer.concat([Buffer.from([0x60 + 5]), Buffer.from(memo, "utf-8")]);
      const base64String = encoded.toString("base64");
      const result = decodeMemoFromCbor(Buffer.from(base64String, "base64"));
      expect(result).toBe(memo);
    });

    it("should throw for invalid CBOR (wrong header)", () => {
      const buffer = Buffer.from([0x40, 0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      expect(() => decodeMemoFromCbor(buffer)).toThrow(
        "Invalid CBOR: expected text string (major type 3), got header byte 0x40",
      );
    });

    it("should throw for truncated 1-byte-length header (buffer too short for length byte)", () => {
      const buffer = Buffer.from([0x78]);
      expect(() => decodeMemoFromCbor(buffer)).toThrow(
        "Invalid CBOR: insufficient data for 1-byte length",
      );
    });

    it("should throw for truncated 2-byte-length header (buffer too short for length bytes)", () => {
      const buffer = Buffer.from([0x79, 0x01]);
      expect(() => decodeMemoFromCbor(buffer)).toThrow(
        "Invalid CBOR: insufficient data for 2-byte length",
      );
    });

    it("should throw for truncated buffer (1-byte-length form, data shorter than declared length)", () => {
      const buffer = Buffer.from([0x78, 100]);
      expect(() => decodeMemoFromCbor(buffer)).toThrow("Invalid CBOR: insufficient data");
    });

    it("should return empty string for empty buffer", () => {
      const result = decodeMemoFromCbor(Buffer.from([]));
      expect(result).toBe("");
    });
  });

  describe("memoEncodedSize", () => {
    it("should return 1-byte overhead for empty string", () => {
      expect(memoEncodedSize("")).toBe(1);
    });

    it("should return 1-byte overhead for short memo (< 24 bytes)", () => {
      const memo = "Hello";
      expect(memoEncodedSize(memo)).toBe(Buffer.byteLength(memo, "utf-8") + 1);
    });

    it("should return 1-byte overhead at 23-byte boundary (max short form)", () => {
      const memo = "a".repeat(23);
      expect(memoEncodedSize(memo)).toBe(24);
    });

    it("should return 2-byte overhead at 24-byte boundary (min long form)", () => {
      const memo = "a".repeat(24);
      expect(memoEncodedSize(memo)).toBe(26);
    });

    it("should match encodeMemoToCbor().length for all lengths", () => {
      for (const len of [0, 1, 10, 23, 24, 100, 254]) {
        const memo = "a".repeat(len);
        expect(memoEncodedSize(memo)).toBe(encodeMemoToCbor(memo).length);
      }
    });

    it("should account for multi-byte UTF-8 characters", () => {
      const memo = "🌍"; // 4 bytes in UTF-8
      expect(memoEncodedSize(memo)).toBe(encodeMemoToCbor(memo).length);
    });
  });

  describe("encode-decode round-trip", () => {
    it("should round-trip short memos (0-23 bytes)", () => {
      for (let i = 0; i <= 23; i++) {
        const memo = "a".repeat(i);
        const encoded = encodeMemoToCbor(memo);
        const decoded = decodeMemoFromCbor(encoded);
        expect(decoded).toBe(memo);
      }
    });

    it("should round-trip medium memos (24-254 bytes)", () => {
      const testLengths = [24, 50, 100, 150, 200, 254];
      for (const length of testLengths) {
        const memo = "a".repeat(length);
        const encoded = encodeMemoToCbor(memo);
        const decoded = decodeMemoFromCbor(encoded);
        expect(decoded).toBe(memo);
      }
    });

    it("should round-trip UTF-8 memos", () => {
      const memos = ["Hello", "世界", "🌍🌎🌏", "Mix: Hello 世界 🌍"];
      for (const memo of memos) {
        const encoded = encodeMemoToCbor(memo);
        const decoded = decodeMemoFromCbor(encoded);
        expect(decoded).toBe(memo);
      }
    });
  });
});

describe("cbor primitives", () => {
  describe("encodeCborUnsigned", () => {
    // Boundaries between the five head forms. A regression here shifts every
    // downstream byte, so pin each transition explicitly.
    it.each([
      [0n, "00"],
      [23n, "17"],
      [24n, "1818"],
      [255n, "18ff"],
      [256n, "190100"],
      [65535n, "19ffff"],
      [65536n, "1a00010000"],
      [4294967295n, "1affffffff"],
      [4294967296n, "1b0000000100000000"],
      [18446744073709551615n, "1bffffffffffffffff"],
    ])("encodes %s using the shortest head", (value, expected) => {
      expect(encodeCborUnsigned(value).toString("hex")).toBe(expected);
    });

    it("rejects a value beyond 64 bits", () => {
      expect(() => encodeCborUnsigned(2n ** 64n)).toThrow(/exceeds 64 bits/);
    });

    it("rejects a negative value", () => {
      expect(() => encodeCborUnsigned(-1n)).toThrow(/non-negative/);
    });
  });

  describe("encodeCborNegative", () => {
    it.each([
      [-1n, "20"],
      [-24n, "37"],
      [-25n, "3818"],
      [-256n, "38ff"],
      [-257n, "390100"],
    ])("encodes %s as -1 - n", (value, expected) => {
      expect(encodeCborNegative(value).toString("hex")).toBe(expected);
    });

    it("rejects a non-negative value", () => {
      expect(() => encodeCborNegative(0n)).toThrow(/negative integer/);
    });
  });

  describe("encodeCborInteger", () => {
    it("picks major type 0 for zero and above", () => {
      expect(encodeCborInteger(0).toString("hex")).toBe("00");
    });

    it("picks major type 1 below zero", () => {
      expect(encodeCborInteger(-6).toString("hex")).toBe("25");
    });
  });

  describe("encodeCborByteString and encodeCborTextString", () => {
    it("encodes a byte string with a major type 2 head", () => {
      expect(encodeCborByteString(Buffer.from([1, 2, 3])).toString("hex")).toBe("43010203");
    });

    it("encodes an empty byte string", () => {
      expect(encodeCborByteString(Buffer.alloc(0)).toString("hex")).toBe("40");
    });

    it("encodes a text string with a major type 3 head", () => {
      expect(encodeCborTextString("amount").toString("hex")).toBe("66616d6f756e74");
    });

    it("measures text length in UTF-8 bytes, not code points", () => {
      expect(encodeCborTextString("é").toString("hex")).toBe("62c3a9");
    });
  });

  describe("encodeCborArray and encodeCborMap", () => {
    it("encodes an array with its item count", () => {
      expect(encodeCborArray([encodeCborUnsigned(1), encodeCborUnsigned(2)]).toString("hex")).toBe(
        "820102",
      );
    });

    it("encodes an empty array", () => {
      expect(encodeCborArray([]).toString("hex")).toBe("80");
    });

    it("encodes a map with its entry count and preserves the given order", () => {
      const encoded = encodeCborMap([
        [encodeCborUnsigned(3), encodeCborUnsigned(4)],
        [encodeCborUnsigned(1), encodeCborUnsigned(2)],
      ]);

      expect(encoded.toString("hex")).toBe("a203040102");
    });
  });

  describe("encodeCborTag", () => {
    // Tag 24 needs the 1-byte argument form: 0xd8 0x18, not a bare 0xd8.
    it("encodes tag 24 with a one-byte argument", () => {
      expect(encodeCborTag(24, encodeCborByteString(Buffer.from([0xff]))).toString("hex")).toBe(
        "d81841ff",
      );
    });

    it("encodes a tag below 24 in a single byte", () => {
      expect(encodeCborTag(4, encodeCborArray([])).toString("hex")).toBe("c480");
    });

    it("encodes a two-byte tag number", () => {
      expect(encodeCborTag(40307, encodeCborUnsigned(0)).toString("hex")).toBe("d99d7300");
    });
  });

  describe("encodeCborMapDeterministic", () => {
    // Bytewise on the encoded key. For text keys the length sits in the head
    // byte, so shorter keys sort first regardless of their content.
    it("sorts integer keys ascending", () => {
      const encoded = encodeCborMapDeterministic([
        [encodeCborUnsigned(3), encodeCborUnsigned(30)],
        [encodeCborUnsigned(1), encodeCborUnsigned(10)],
      ]);

      expect(encoded.toString("hex")).toBe("a2010a03181e");
    });

    it("sorts text keys by encoded bytes, so shorter keys come first", () => {
      const encoded = encodeCborMapDeterministic([
        [encodeCborTextString("recipient"), encodeCborUnsigned(3)],
        [encodeCborTextString("amount"), encodeCborUnsigned(1)],
        [encodeCborTextString("memo"), encodeCborUnsigned(2)],
      ]);

      const hex = encoded.toString("hex");
      expect(hex.indexOf("646d656d6f")).toBeLessThan(hex.indexOf("66616d6f756e74"));
      expect(hex.indexOf("66616d6f756e74")).toBeLessThan(hex.indexOf("69726563697069656e74"));
    });

    it("does not mutate the caller's entry array", () => {
      const entries: [Buffer, Buffer][] = [
        [encodeCborUnsigned(3), encodeCborUnsigned(30)],
        [encodeCborUnsigned(1), encodeCborUnsigned(10)],
      ];

      encodeCborMapDeterministic(entries);

      expect(entries[0][0].toString("hex")).toBe("03");
    });

    it("rejects a duplicate key", () => {
      expect(() =>
        encodeCborMapDeterministic([
          [encodeCborUnsigned(1), encodeCborUnsigned(10)],
          [encodeCborUnsigned(1), encodeCborUnsigned(20)],
        ]),
      ).toThrow(/duplicate key/);
    });
  });
});

describe("cbor integer safety", () => {
  // A literal past 2^53 is already rounded before it reaches the encoder, so
  // encoding it would silently emit a different number.
  it("rejects an unsafe number for an unsigned integer", () => {
    expect(() => encodeCborUnsigned(9007199254740993)).toThrow(/safe JavaScript integer/);
  });

  it("rejects an unsafe number for a negative integer", () => {
    expect(() => encodeCborNegative(-9007199254740993)).toThrow(/safe JavaScript integer/);
  });

  // Number.MAX_SAFE_INTEGER is 2^53 - 1, so 2^53 itself is already unsafe.
  it("accepts the largest safe number and rejects the next one", () => {
    expect(() => encodeCborInteger(Number.MAX_SAFE_INTEGER)).not.toThrow();
    expect(() => encodeCborInteger(2 ** 53)).toThrow(/safe JavaScript integer/);
  });

  it("rejects an unsafe number as a tag", () => {
    expect(() => encodeCborTag(2 ** 53, encodeCborUnsigned(0))).toThrow(/safe JavaScript integer/);
  });

  it("still accepts the full 64-bit range as a bigint", () => {
    expect(encodeCborUnsigned(2n ** 64n - 1n).toString("hex")).toBe("1bffffffffffffffff");
  });
});
