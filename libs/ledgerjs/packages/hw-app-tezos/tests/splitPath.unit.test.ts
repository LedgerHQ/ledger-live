import { splitPath } from "../src/Tezos";

describe("splitPath", () => {
  it("should split derivation path correctly and respect hardened paths", () => {
    expect(splitPath("44'/1729'/0'/0'")).toEqual([
      44 + 0x80000000,
      1729 + 0x80000000,
      0x80000000,
      0x80000000,
    ]);
  });

  it("should reject non-numeric path segments instead of skipping them", () => {
    expect(() => splitPath("44'/NOTAINDEX'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => splitPath("44'/12abc'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => splitPath("44'/2147483648'/0'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => splitPath("44'//0'/0'")).toThrow(/Invalid BIP32 path segment/);
  });
});
