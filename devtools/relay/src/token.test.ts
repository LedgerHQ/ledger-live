import { generateToken, isLoopback, validateToken } from "./token";

describe("generateToken", () => {
  it("returns a 32-character hex string", () => {
    expect(generateToken()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns a different value on each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("isLoopback", () => {
  it("returns true for IPv4 loopback", () => {
    expect(isLoopback("127.0.0.1")).toBe(true);
  });

  it("returns true for IPv6 loopback", () => {
    expect(isLoopback("::1")).toBe(true);
  });

  it("returns false for a LAN address", () => {
    expect(isLoopback("192.168.1.42")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isLoopback(undefined)).toBe(false);
  });
});

describe("validateToken", () => {
  it("returns true when the URL carries the correct token", () => {
    expect(validateToken("/?role=tool&token=abc123", "abc123")).toBe(true);
  });

  it("returns false when the token param is wrong", () => {
    expect(validateToken("/?token=wrong", "abc123")).toBe(false);
  });

  it("returns false when the token param is missing", () => {
    expect(validateToken("/?role=tool", "abc123")).toBe(false);
  });

  it("returns false for an undefined URL", () => {
    expect(validateToken(undefined, "abc123")).toBe(false);
  });
});
