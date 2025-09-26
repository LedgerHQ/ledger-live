import { isRecipientValid, validateTag } from "./utils";
import BigNumber from "bignumber.js";

describe("utils", () => {
  describe("isRecipientValid", () => {
    it("should return true for valid Canton addresses", () => {
      const validAddresses = [
        "abc::123",
        "hello::1",
        "test123::456",
        "a::0",
        "party::999",
        "user123::42",
        "canton_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z::123",
        "test::123456789",
      ];

      validAddresses.forEach(address => {
        expect(isRecipientValid(address)).toBe(true);
      });
    });

    it("should return false for invalid Canton addresses", () => {
      const invalidAddresses = [
        "", // empty string
        "::123", // no characters before ::
        "abc::", // no numbers after ::
        "abc:123", // single colon instead of double
        "abc::abc", // letters instead of numbers after ::
        "abc::", // empty after ::
        "::", // only colons
        "abc", // no colons
        "123", // no colons
        "abc::123abc", // mixed letters and numbers after ::
        "abc::123.456", // decimal numbers
        "abc::-123", // negative numbers
        "abc::+123", // positive sign
        "abc:: 123", // space before number
        "abc::123 ", // space after number
        "abc:: 123", // space after ::
      ];

      invalidAddresses.forEach(address => {
        expect(isRecipientValid(address)).toBe(false);
      });
    });

    it("should handle edge cases", () => {
      expect(isRecipientValid("a::1")).toBe(true); // minimum valid case
      expect(isRecipientValid("1::1")).toBe(true); // number before ::
      expect(isRecipientValid("_::1")).toBe(true); // underscore before ::
      expect(isRecipientValid("-::1")).toBe(true); // dash before ::
      expect(isRecipientValid(".::1")).toBe(true); // dot before ::
    });

    it("should handle addresses with spaces and multiple colons", () => {
      // These are valid according to our regex but might not be ideal Canton addresses
      expect(isRecipientValid(" abc::123")).toBe(true); // space before address
      expect(isRecipientValid("abc ::123")).toBe(true); // space before ::
      expect(isRecipientValid("abc::123::456")).toBe(true); // multiple ::
    });
  });

  describe("validateTag", () => {
    it("should return true for valid tags", () => {
      const validTags = [
        new BigNumber(1),
        new BigNumber(42),
        new BigNumber(4294967295), // UINT32_MAX
        new BigNumber(0),
      ];

      validTags.forEach(tag => {
        expect(validateTag(tag)).toBe(true);
      });
    });

    it("should return false for invalid tags", () => {
      const invalidTags = [
        new BigNumber(-1), // negative
        new BigNumber(4294967296), // greater than UINT32_MAX
        new BigNumber(1.5), // decimal
        new BigNumber(NaN), // NaN
        new BigNumber(Infinity), // Infinity
        new BigNumber(-Infinity), // -Infinity
      ];

      invalidTags.forEach(tag => {
        expect(validateTag(tag)).toBe(false);
      });
    });
  });
});
