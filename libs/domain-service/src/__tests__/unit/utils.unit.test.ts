import { validateDomain } from "../../utils/index";

describe("Domain Service", () => {
  describe("Utils", () => {
    describe("validateDomain", () => {
      it("should return true for a valid domain", () => {
        expect(validateDomain("vitalik.eth")).toBe(true);
      });

      it("should return false for a wrongly typed domain", () => {
        expect(validateDomain({ domain: "vitalik.eth" } as any)).toBe(false);
      });

      it("should return false for a domain with 0 length", () => {
        expect(validateDomain("")).toBe(false);
      });

      it("should return false for a domain with a length too high", () => {
        expect(validateDomain(new Array(256).fill("a").join(""))).toBe(false);
      });

      it("should return false for a domain with unicode", () => {
        expect(validateDomain("hello👋")).toBe(false);
      });

      it("should return true for a domain with any ASCII chars", () => {
        const stringOfAllAsciiChars = String.fromCharCode(
          ...new Array(125).fill(null).map((_, i) => i)
        );
        expect(validateDomain("test" + stringOfAllAsciiChars)).toBe(true);
      });

      it.each(
        // According to doc, max value possible for caracters is a uint16.
        // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode#parameters
        new Array(0xffff)
          .fill(null)
          .map((_, i) => ({ code: i, value: String.fromCharCode(i) }))
      )(
        "should accept or reject a domain depending on if it's containing ASCII or non ASCII caracters. Testing: {%o}",
        (char) => {
          if (char.code <= 127) {
            // 127 => "~" everything after that caracter is refused
            expect(validateDomain("randomDomain" + char.value)).toBe(true);
          } else {
            expect(validateDomain("randomDomain" + char.value)).toBe(false);
          }
        }
      );
    });
  });
});
