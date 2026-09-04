import { bip32PathToBytes } from "../src/utils";

describe("bip32PathToBytes", () => {
  it("should encode a hardened path", () => {
    const bytes = bip32PathToBytes("44'/397'/0'/0'/1'");
    expect(bytes.length).toBe(20);
    expect(bytes.readUInt32BE(0)).toBe(44 + 0x80000000);
    expect(bytes.readUInt32BE(4)).toBe(397 + 0x80000000);
  });

  it("should reject non-numeric path segments instead of mapping NaN to hardened 0", () => {
    expect(() => bip32PathToBytes("44'/NOTAINDEX'/0'/0'/1'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => bip32PathToBytes("44'/12abc'/0'/0'/1'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => bip32PathToBytes("44'/2147483648'/0'/0'/1'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => bip32PathToBytes("44'//0'/0'/1'")).toThrow(/Invalid BIP32 path segment/);
  });
});
