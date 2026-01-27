import BigNumber from "bignumber.js";
import { isRecipientValid, validateTag } from "./utils";

const VALID_HEX_68 = "1220691e945dc1b210f3b6be9fbad73efaf642bfb96022552f66c9e2b83b00cb20e8";

describe("utils", () => {
  describe("isRecipientValid", () => {
    describe("valid addresses", () => {
      const testCases = [
        { description: "standard address", address: `ldg::${VALID_HEX_68}` },
        { description: "address with dash in prefix", address: `ldg-with-dash::${VALID_HEX_68}` },
        {
          description: "address with number and dash in prefix",
          address: `ldg-with-number-1::${VALID_HEX_68}`,
        },
        {
          description: "address with underscore in prefix",
          address: `ldg_with_underscore::${VALID_HEX_68}`,
        },
        { description: "single letter prefix", address: `a::${VALID_HEX_68}` },
        { description: "single number prefix", address: `1::${VALID_HEX_68}` },
        { description: "all numeric prefix", address: `123::${VALID_HEX_68}` },
        { description: "prefix starting with dash", address: `-abc::${VALID_HEX_68}` },
        { description: "prefix starting with underscore", address: `_abc::${VALID_HEX_68}` },
        { description: "prefix with mixed characters", address: `a-1_2::${VALID_HEX_68}` },
        {
          description: "maximum length prefix (128 chars)",
          address: `a${"x".repeat(127)}::${VALID_HEX_68}`,
        },
      ];

      testCases.forEach(({ description, address }) => {
        it(`should return true for ${description}`, () => {
          expect(isRecipientValid(address)).toBe(true);
        });
      });
    });

    describe("invalid addresses - format errors", () => {
      const testCases = [
        { description: "empty string", address: "" },
        { description: "no colons", address: "abc" },
        { description: "no colons (numbers only)", address: "123" },
        { description: "single colon instead of double", address: "abc:123" },
        { description: "only colons", address: "::" },
        { description: "empty prefix", address: "::123" },
        { description: "empty hex part", address: "abc::" },
        { description: "multiple double colons", address: "abc::123::456" },
        { description: "multiple double colons with letters", address: "abc::abc::def" },
      ];

      testCases.forEach(({ description, address }) => {
        it(`should return false for ${description}`, () => {
          expect(isRecipientValid(address)).toBe(false);
        });
      });
    });

    describe("invalid addresses - hex fingerprint length", () => {
      const testCases = [
        {
          description: "too short fingerprint (67 chars)",
          address: `ldg::${VALID_HEX_68.slice(0, -1)}`,
        },
        { description: "too long fingerprint (69 chars)", address: `ldg::${VALID_HEX_68}0` },
        { description: "single hex digit", address: "a::1" },
        { description: "single hex letter", address: "a::a" },
        { description: "very short hex", address: "a::123" },
      ];

      testCases.forEach(({ description, address }) => {
        it(`should return false for ${description}`, () => {
          expect(isRecipientValid(address)).toBe(false);
        });
      });
    });

    describe("invalid addresses - hex fingerprint format", () => {
      const testCases = [
        {
          description: "uppercase hex (all uppercase)",
          address: `abc::${VALID_HEX_68.toUpperCase()}`,
        },
        { description: "uppercase hex character", address: `abc::A${VALID_HEX_68.slice(1)}` },
        { description: "decimal numbers in hex", address: "abc::123.456" },
        { description: "negative sign in hex", address: "abc::-123" },
        { description: "positive sign in hex", address: "abc::+123" },
        { description: "dash in hex part", address: "abc::123-abc" },
        { description: "underscore in hex part", address: "abc::123_abc" },
        { description: "dot in hex part", address: "abc::123.abc" },
        { description: "space in hex part", address: "abc::123 abc" },
      ];

      testCases.forEach(({ description, address }) => {
        it(`should return false for ${description}`, () => {
          expect(isRecipientValid(address)).toBe(false);
        });
      });
    });

    describe("invalid addresses - prefix length", () => {
      const testCases = [
        {
          description: "prefix exceeds max length (129 chars)",
          address: `a${"x".repeat(128)}::${VALID_HEX_68}`,
        },
        { description: "very long prefix", address: `a${"x".repeat(200)}::${VALID_HEX_68}` },
      ];

      testCases.forEach(({ description, address }) => {
        it(`should return false for ${description}`, () => {
          expect(isRecipientValid(address)).toBe(false);
        });
      });
    });

    describe("invalid addresses - prefix character validation", () => {
      const testCases = [
        { description: "dot in prefix", address: ".::1" },
        { description: "space in prefix", address: "ab c::123" },
        { description: "special characters in prefix", address: "abc@def::123" },
        { description: "unicode characters in prefix", address: `abcé::${VALID_HEX_68}` },
      ];

      testCases.forEach(({ description, address }) => {
        it(`should return false for ${description}`, () => {
          expect(isRecipientValid(address)).toBe(false);
        });
      });
    });

    describe("invalid addresses - whitespace", () => {
      const testCases = [
        { description: "space before address", address: " abc::123" },
        { description: "space after address", address: "abc::123 " },
        { description: "space before double colon", address: "abc ::123" },
        { description: "space after double colon", address: "abc:: 123" },
        { description: "tab character before address", address: "\tabc::123" },
        { description: "newline character in address", address: "abc::123\n" },
      ];

      testCases.forEach(({ description, address }) => {
        it(`should return false for ${description}`, () => {
          expect(isRecipientValid(address)).toBe(false);
        });
      });
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
