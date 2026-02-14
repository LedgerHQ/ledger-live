import { addPrefixToken, extractTokenId } from "./tokens";

describe("tokens", () => {
  describe("addPrefixToken", () => {
    it("should add algorand/asa/ prefix to token ID", () => {
      expect(addPrefixToken("12345")).toBe("algorand/asa/12345");
    });

    it("should handle numeric token IDs", () => {
      expect(addPrefixToken("0")).toBe("algorand/asa/0");
      expect(addPrefixToken("999999999")).toBe("algorand/asa/999999999");
    });

    it("should handle empty string", () => {
      expect(addPrefixToken("")).toBe("algorand/asa/");
    });

    it("should handle USDC token ID", () => {
      expect(addPrefixToken("31566704")).toBe("algorand/asa/31566704");
    });
  });

  describe("extractTokenId", () => {
    it("should extract token ID from prefixed string", () => {
      expect(extractTokenId("algorand/asa/12345")).toBe("12345");
    });

    it("should extract USDC token ID", () => {
      expect(extractTokenId("algorand/asa/31566704")).toBe("31566704");
    });

    it("should handle token ID with only two parts", () => {
      expect(extractTokenId("algorand/asa")).toBeUndefined();
    });

    it("should handle empty token ID", () => {
      expect(extractTokenId("algorand/asa/")).toBe("");
    });

    it("should return undefined for single value", () => {
      expect(extractTokenId("12345")).toBeUndefined();
    });
  });

  describe("round-trip", () => {
    it("should preserve token ID through addPrefix and extract", () => {
      const originalId = "31566704";
      const prefixed = addPrefixToken(originalId);
      const extracted = extractTokenId(prefixed);

      expect(extracted).toBe(originalId);
    });

    it("should work with various token IDs", () => {
      const tokenIds = ["0", "1", "12345", "999999999", "31566704"];

      for (const id of tokenIds) {
        expect(extractTokenId(addPrefixToken(id))).toBe(id);
      }
    });
  });
});
