import { resolveHardenedBip32Path } from "../src/bip32Path";

describe("resolveHardenedBip32Path", () => {
  it("should harden and parse a valid Stellar path", () => {
    const path = resolveHardenedBip32Path("44'/148'/0'");
    expect(path).toEqual([44 + 0x80000000, 148 + 0x80000000, 0x80000000]);
  });

  it("should reject truncated/garbage segments instead of de-hardening via bip32-path", () => {
    expect(() => resolveHardenedBip32Path("44'/12abc'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => resolveHardenedBip32Path("44'/2147483648'/0'")).toThrow(/Invalid BIP32 path segment/);
    expect(() => resolveHardenedBip32Path("44'/NOTAINDEX'/0'")).toThrow(
      /Invalid BIP32 path segment/,
    );
    expect(() => resolveHardenedBip32Path("44'//0'")).toThrow(/Invalid BIP32 path segment/);
  });
});
