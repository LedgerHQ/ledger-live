import { resolveBip32Path } from "../src/bip32Path";

describe("resolveBip32Path", () => {
  it("should parse a valid Hedera path", () => {
    const path = resolveBip32Path("44'/3030'/0'/0'/0'");
    expect(path).toEqual([
      44 + 0x80000000,
      3030 + 0x80000000,
      0x80000000,
      0x80000000,
      0x80000000,
    ]);
  });

  it("should reject truncated/garbage segments instead of truncating via bip32-path", () => {
    expect(() => resolveBip32Path("44'/12abc'/0'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => resolveBip32Path("44'/2147483648'/0'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => resolveBip32Path("44'/NOTAINDEX'/0'/0'/0'")).toThrow(
      /Invalid BIP32 path segment/,
    );
    expect(() => resolveBip32Path("44'//0'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
  });
});
