import { pathStringToArray } from "../src/bip32";

describe("pathStringToArray", () => {
  it("should parse a valid Aptos path", () => {
    const path = pathStringToArray("44'/637'/0'/0'/0'");
    expect(path).toEqual([
      44 + 0x80000000,
      637 + 0x80000000,
      0x80000000,
      0x80000000,
      0x80000000,
    ]);
  });

  it("should reject truncated/garbage segments instead of truncating via bip32-path", () => {
    expect(() => pathStringToArray("44'/12abc'/0'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => pathStringToArray("44'/2147483648'/0'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => pathStringToArray("44'/NOTAINDEX'/0'/0'/0'")).toThrow(
      /Invalid BIP32 path segment/,
    );
    expect(() => pathStringToArray("44'//0'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
  });
});
