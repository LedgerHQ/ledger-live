import { encodeMemoToCbor, decodeMemoFromCbor, memoEncodedSize } from "./cbor";

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
