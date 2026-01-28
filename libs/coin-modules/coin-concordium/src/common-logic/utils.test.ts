import { DataBlob } from "@ledgerhq/concordium-sdk-adapter";
import { encodeMemoAsCbor, decodeMemoFromCbor, encodeMemoToDataBlob } from "./utils";

describe("CBOR memo encoding/decoding", () => {
  describe("encodeMemoAsCbor", () => {
    it("should encode empty string (short form)", () => {
      const result = encodeMemoAsCbor("");
      expect(result).toEqual(Buffer.from([0x60])); // 0x60 = empty text string
    });

    it("should encode short memo (0-23 bytes, short form)", () => {
      const memo = "Hello";
      const result = encodeMemoAsCbor(memo);
      const expected = Buffer.concat([
        Buffer.from([0x60 + 5]), // 0x65 = text string of length 5
        Buffer.from(memo, "utf-8"),
      ]);
      expect(result).toEqual(expected);
    });

    it("should encode 23-byte memo (max short form)", () => {
      const memo = "a".repeat(23);
      const result = encodeMemoAsCbor(memo);
      const expected = Buffer.concat([
        Buffer.from([0x60 + 23]), // 0x77 = text string of length 23
        Buffer.from(memo, "utf-8"),
      ]);
      expect(result).toEqual(expected);
    });

    it("should encode 24-byte memo (1-byte length form)", () => {
      const memo = "a".repeat(24);
      const result = encodeMemoAsCbor(memo);
      const expected = Buffer.concat([
        Buffer.from([0x78, 24]), // 0x78 + length byte
        Buffer.from(memo, "utf-8"),
      ]);
      expect(result).toEqual(expected);
    });

    it("should encode 100-byte memo (1-byte length form)", () => {
      const memo = "a".repeat(100);
      const result = encodeMemoAsCbor(memo);
      const expected = Buffer.concat([Buffer.from([0x78, 100]), Buffer.from(memo, "utf-8")]);
      expect(result).toEqual(expected);
    });

    it("should encode 254-byte memo (max supported length)", () => {
      const memo = "a".repeat(254);
      const result = encodeMemoAsCbor(memo);
      const expected = Buffer.concat([Buffer.from([0x78, 254]), Buffer.from(memo, "utf-8")]);
      expect(result).toEqual(expected);
    });

    it("should encode UTF-8 characters correctly", () => {
      const memo = "Hello 世界 🌍";
      const result = encodeMemoAsCbor(memo);
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
      expect(() => encodeMemoAsCbor(memo)).toThrow(
        "Memo length 255 exceeds maximum supported size of 254 bytes",
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

    it("should decode from hex string", () => {
      const memo = "Hello";
      const encoded = Buffer.concat([Buffer.from([0x60 + 5]), Buffer.from(memo, "utf-8")]);
      const hexString = encoded.toString("hex");
      const result = decodeMemoFromCbor(hexString);
      expect(result).toBe(memo);
    });

    it("should decode from base64 string", () => {
      const memo = "Hello";
      const encoded = Buffer.concat([Buffer.from([0x60 + 5]), Buffer.from(memo, "utf-8")]);
      const base64String = encoded.toString("base64");
      const result = decodeMemoFromCbor(base64String);
      expect(result).toBe(memo);
    });

    it("should handle invalid CBOR gracefully (wrong header)", () => {
      const buffer = Buffer.from([0x40, 0x48, 0x65, 0x6c, 0x6c, 0x6f]); // byte string, not text string
      const result = decodeMemoFromCbor(buffer);
      expect(typeof result).toBe("string");
    });

    it("should handle truncated buffer gracefully", () => {
      const buffer = Buffer.from([0x78, 100]); // Says 100 bytes but no data
      const result = decodeMemoFromCbor(buffer);
      expect(typeof result).toBe("string");
    });

    it("should return empty string for empty buffer", () => {
      const result = decodeMemoFromCbor(Buffer.from([]));
      expect(result).toBe("");
    });
  });

  describe("encode-decode round-trip", () => {
    it("should round-trip short memos (0-23 bytes)", () => {
      for (let i = 0; i <= 23; i++) {
        const memo = "a".repeat(i);
        const encoded = encodeMemoAsCbor(memo);
        const decoded = decodeMemoFromCbor(encoded);
        expect(decoded).toBe(memo);
      }
    });

    it("should round-trip medium memos (24-254 bytes)", () => {
      const testLengths = [24, 50, 100, 150, 200, 254];
      for (const length of testLengths) {
        const memo = "a".repeat(length);
        const encoded = encodeMemoAsCbor(memo);
        const decoded = decodeMemoFromCbor(encoded);
        expect(decoded).toBe(memo);
      }
    });

    it("should round-trip UTF-8 memos", () => {
      const memos = ["Hello", "世界", "🌍🌎🌏", "Mix: Hello 世界 🌍"];
      for (const memo of memos) {
        const encoded = encodeMemoAsCbor(memo);
        const decoded = decodeMemoFromCbor(encoded);
        expect(decoded).toBe(memo);
      }
    });
  });

  describe("encodeMemoToDataBlob", () => {
    it("should encode memo and return DataBlob", () => {
      const memo = "Hello";
      const dataBlob = encodeMemoToDataBlob(memo);

      expect(dataBlob).toBeInstanceOf(DataBlob);
      expect(typeof dataBlob).toBe("object");
    });

    it("should create valid DataBlob from various memo lengths", () => {
      const testMemos = [
        "",
        "Short",
        "a".repeat(23),
        "a".repeat(24),
        "a".repeat(100),
        "a".repeat(254),
      ];

      for (const memo of testMemos) {
        const dataBlob = encodeMemoToDataBlob(memo);
        expect(dataBlob).toBeInstanceOf(DataBlob);
      }
    });
  });
});
