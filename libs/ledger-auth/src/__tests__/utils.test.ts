import { bytesToBase64Url, createRandomBase64UrlValue, sortObject, stringToBytes } from "../utils";

describe("utils", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("bytesToBase64Url", () => {
    it("converts bytes to unpadded base64url", () => {
      expect(bytesToBase64Url(Uint8Array.from([251, 255, 191]))).toBe("-_-_");
    });

    it("accepts ArrayBuffer input", () => {
      expect(bytesToBase64Url(new TextEncoder().encode("test").buffer)).toBe("dGVzdA");
    });
  });

  describe("stringToBytes", () => {
    it("encodes strings as UTF-8 bytes", () => {
      expect(Array.from(new Uint8Array(stringToBytes("test")))).toEqual([116, 101, 115, 116]);
    });
  });

  describe("createRandomBase64UrlValue", () => {
    it("generates a base64url value from 32 random bytes", () => {
      expect(createRandomBase64UrlValue()).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("sortObject", () => {
    it("sorts object keys recursively and drops undefined values", () => {
      expect(
        JSON.stringify(
          sortObject({
            z: 1,
            a: { c: 3, b: 2, empty: undefined },
            list: [{ d: 4, a: 1 }],
          }),
        ),
      ).toBe('{"a":{"b":2,"c":3},"list":[{"a":1,"d":4}],"z":1}');
    });
  });
});
