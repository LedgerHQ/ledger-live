import {
  bytesToBase64Url,
  createRandomBase64UrlValue,
  getTokenState,
  stringToBytes,
} from "../utils";

function makeJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
}

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

  describe("getTokenState", () => {
    const nowSeconds = 10 ** 9;
    const nowMs = 10 ** 12;

    it("returns 'valid' for a token expiring well in the future", () => {
      const jwt = makeJwt({ exp: nowSeconds + 3600 });
      expect(getTokenState(jwt, nowMs)).toBe("valid");
    });

    it("returns 'expired' for a token whose exp is in the past", () => {
      const jwt = makeJwt({ exp: nowSeconds - 3600 });
      expect(getTokenState(jwt, nowMs)).toBe("expired");
    });

    it("returns 'stale' within the refresh skew window", () => {
      const jwt = makeJwt({ exp: nowSeconds + 2 });
      expect(getTokenState(jwt, nowMs)).toBe("stale");
    });

    it("returns 'invalid' when there is no exp claim", () => {
      const jwt = makeJwt({ sub: "user" });
      expect(getTokenState(jwt, nowMs)).toBe("invalid");
    });

    it("returns 'invalid' for a non-JWT string", () => {
      expect(getTokenState("not-a-jwt", nowMs)).toBe("invalid");
    });
  });
});
