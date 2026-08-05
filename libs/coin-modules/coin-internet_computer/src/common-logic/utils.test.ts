import { getBufferFromString, isValidHex } from "./utils";

describe("isValidHex", () => {
  it("accepts a whole even-length hex string (>= 3 bytes)", () => {
    expect(isValidHex("deadbeef")).toBe(true);
  });

  it("rejects a hex run embedded in non-hex text", () => {
    expect(isValidHex("hello deadbeef world")).toBe(false);
  });

  it("rejects odd-length, too-short (< 3 bytes), and empty input", () => {
    expect(isValidHex("abc")).toBe(false);
    expect(isValidHex("12")).toBe(false);
    expect(isValidHex("1234")).toBe(false);
    expect(isValidHex("")).toBe(false);
  });
});

describe("getBufferFromString", () => {
  it("hex-decodes a whole hex string", () => {
    expect(getBufferFromString("deadbeef")).toEqual(Buffer.from("deadbeef", "hex"));
  });

  it("keeps text with an embedded hex run as UTF-8 (no spurious hex decode)", () => {
    const message = "hello deadbeef world";
    expect(getBufferFromString(message)).toEqual(Buffer.from(message));
  });

  it("does not hex-decode a short hex-looking string (preserves the prior boundary)", () => {
    expect(getBufferFromString("1234")).toEqual(Buffer.from("1234", "base64"));
  });
});
