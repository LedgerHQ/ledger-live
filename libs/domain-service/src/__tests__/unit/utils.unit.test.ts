import { validateDomain } from "../../utils/index";

// List of characters that are accepted as part of a domain
const validCharCodes = (() => {
  const codes: number[] = [];

  // addind every numbers. Char codes from 48 to 57 included
  for (let i = 48; i <= 57; i++) {
    codes.push(i);
  }

  // addind every uppercase letter. Char codes from 65 to 90 included
  for (let i = 65; i <= 90; i++) {
    codes.push(i);
  }

  // addind every lowercase letter. Char codes from 97 to 122 included
  for (let i = 97; i <= 122; i++) {
    codes.push(i);
  }

  const extraChars = "-_.";
  for (let i = 0; i < extraChars.length; i++) {
    codes.push(extraChars.charCodeAt(i));
  }

  return codes;
})();

describe("Domain Service", () => {
  describe("Utils", () => {
    describe("validateDomain", () => {
      it("should return true for a valid domain", () => {
        expect(validateDomain("vitalik.eth")).toBe(true);
      });

      it("should return true for a valid domain with a -", () => {
        expect(validateDomain("vital-ik.eth")).toBe(true);
      });

      it("should return true for a valid domain with a _", () => {
        expect(validateDomain("vital_ik.eth")).toBe(true);
      });

      it("should return true for a valid domain with a .", () => {
        expect(validateDomain("vital.ik.eth")).toBe(true);
      });

      it("should return false for a wrongly typed domain", () => {
        expect(validateDomain({ domain: "vitalik.eth" } as any)).toBe(false);
      });

      it("should return false for a domain with 0 length", () => {
        expect(validateDomain("")).toBe(false);
      });

      it("should return false for a domain with a length too high", () => {
        expect(validateDomain(new Array(31).fill("a").join(""))).toBe(false);
      });

      it("should return false for a domain with unicode", () => {
        expect(validateDomain("hello👋")).toBe(false);
      });

      it.each(
        // According to doc, max value possible for caracters is a uint16.
        // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode#parameters
        new Array(0xffff).fill(null).map((_, i) => ({ code: i, value: String.fromCharCode(i) })),
      )(
        "should accept or reject a domain depending on if it's containing ASCII or non ASCII caracters. Testing: {%o}",
        char => {
          if (validCharCodes.includes(char.code)) {
            // 127 => "~" everything after that caracter is refused
            expect(validateDomain("randomDomain" + char.value)).toBe(true);
          } else {
            expect(validateDomain("randomDomain" + char.value)).toBe(false);
          }
        },
      );
    });
  });
});
