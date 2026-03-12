import BigNumber from "bignumber.js";
import { isRecipientValid, validateTag } from "./utils";

describe("utils", () => {
  describe("isRecipientValid", () => {
    it("should return true for valid Canton addresses", () => {
      const validAddresses = [
        "ldg::1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e8",
        "ldg-with-dash::1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e8",
        "ldg-with-number-1::1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e8",
      ];

      validAddresses.forEach(address => {
        expect(isRecipientValid(address)).toBe(true);
      });
    });

    it("should return false for invalid Canton addresses", () => {
      const invalidAddresses = [
        "ldg::1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e", // too short fingerprint
        "ldg::1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e80", // too long fingerprint
        "", // empty string
        "::123", // no characters before ::
        "abc::", // no characters after ::
        "abc:123", // single colon instead of double
        "abc::", // empty after ::
        "::", // only colons
        "abc", // no colons
        "123", // no colons
        "abc::123.456", // decimal numbers
        "abc::-123", // negative numbers
        "abc::+123", // positive sign
        "abc:: 123", // space before alphanumeric
        "abc::123 ", // space after alphanumeric
        "abc:: 123", // space after ::
        "abc::123-abc", // dash in alphanumeric part
        "abc::123_abc", // underscore in alphanumeric part
        "abc::123.abc", // dot in alphanumeric part
        "abc::123 abc", // space in alphanumeric part
        "abc::", // empty after ::
      ];

      invalidAddresses.forEach(address => {
        expect(isRecipientValid(address)).toBe(false);
      });
    });

    it("should handle edge cases", () => {
      const validHex68 = "1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e8";
      expect(isRecipientValid(`a::${validHex68}`)).toBe(true); // single letter prefix
      expect(isRecipientValid(`1::${validHex68}`)).toBe(true); // single number prefix
      expect(isRecipientValid(`a-1::${validHex68}`)).toBe(true); // prefix with dash

      // Invalid edge cases (should be false)
      expect(isRecipientValid("a::1")).toBe(false); // too short hex
      expect(isRecipientValid("a::a")).toBe(false); // too short hex
      expect(isRecipientValid("_::1")).toBe(false); // invalid prefix character
      expect(isRecipientValid(".::1")).toBe(false); // invalid prefix character
    });

    it("should reject addresses with spaces and multiple colons", () => {
      expect(isRecipientValid(" abc::123")).toBe(false); // space before address
      expect(isRecipientValid(" abc::abc")).toBe(false); // space before address with letters
      expect(isRecipientValid("abc ::123")).toBe(false); // space before ::
      expect(isRecipientValid("abc ::abc")).toBe(false); // space before :: with letters
      expect(isRecipientValid("abc::123::456")).toBe(false); // multiple ::
      expect(isRecipientValid("abc::abc::def")).toBe(false); // multiple :: with letters
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
