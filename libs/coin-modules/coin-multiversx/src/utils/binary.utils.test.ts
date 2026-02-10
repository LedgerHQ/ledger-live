import { BinaryUtils } from "./binary.utils";

describe("BinaryUtils", () => {
  describe("base64Encode", () => {
    it("encodes a simple string to base64", () => {
      const result = BinaryUtils.base64Encode("hello");
      expect(result).toBe("aGVsbG8=");
    });

    it("encodes an empty string", () => {
      const result = BinaryUtils.base64Encode("");
      expect(result).toBe("");
    });

    it("encodes 'delegate' correctly (used in transactions)", () => {
      const result = BinaryUtils.base64Encode("delegate");
      expect(result).toBe("ZGVsZWdhdGU=");
    });

    it("encodes 'ESDTTransfer' correctly", () => {
      const result = BinaryUtils.base64Encode("ESDTTransfer");
      expect(result).toBe("RVNEVFRyYW5zZmVy");
    });

    it("encodes strings with special characters", () => {
      const result = BinaryUtils.base64Encode("test@123");
      expect(result).toBe("dGVzdEAxMjM=");
    });

    it("encodes unicode strings", () => {
      const result = BinaryUtils.base64Encode("Ω");
      // Unicode omega character
      expect(result).toBeTruthy();
    });
  });

  describe("base64Decode", () => {
    it("decodes a simple base64 string", () => {
      const result = BinaryUtils.base64Decode("aGVsbG8=");
      expect(result).toBe("hello");
    });

    it("decodes an empty string", () => {
      const result = BinaryUtils.base64Decode("");
      expect(result).toBe("");
    });

    it("decodes 'delegate' base64", () => {
      const result = BinaryUtils.base64Decode("ZGVsZWdhdGU=");
      expect(result).toBe("delegate");
    });

    it("decodes 'ESDTTransfer' base64", () => {
      const result = BinaryUtils.base64Decode("RVNEVFRyYW5zZmVy");
      expect(result).toBe("ESDTTransfer");
    });

    it("round-trips encode and decode", () => {
      const original = "test string with spaces and @symbols!";
      const encoded = BinaryUtils.base64Encode(original);
      const decoded = BinaryUtils.base64Decode(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe("encode/decode symmetry", () => {
    const testStrings = [
      "hello",
      "delegate",
      "claimRewards",
      "withdraw",
      "reDelegateRewards",
      "unDelegate",
      "ESDTTransfer@USDC-abc123@1000000",
      "",
      "12345",
      "a",
    ];

    testStrings.forEach(str => {
      it(`encode then decode returns original for "${str}"`, () => {
        const encoded = BinaryUtils.base64Encode(str);
        const decoded = BinaryUtils.base64Decode(encoded);
        expect(decoded).toBe(str);
      });
    });
  });
});
