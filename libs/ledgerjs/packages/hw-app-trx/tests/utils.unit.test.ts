import { splitPath } from "../src/utils";

describe("splitPath", () => {
  it("parses hardened and non-hardened segments", () => {
    expect(splitPath("44'/195'/0'/0/0")).toEqual([
      44 + 0x80000000,
      195 + 0x80000000,
      0x80000000,
      0,
      0,
    ]);
  });

  it("rejects non-numeric/truncated segments instead of skipping them", () => {
    expect(() => splitPath("44'/NOTAINDEX'/0'/0/0")).toThrow(/Invalid BIP32 path segment/);
    expect(() => splitPath("44'/12abc'/0'/0/0")).toThrow(/Invalid BIP32 path segment/);
    expect(() => splitPath("44'//0'/0/0")).toThrow(/Invalid BIP32 path segment/);
  });

  it("rejects segments above the BIP32 max index", () => {
    expect(() => splitPath("44'/2147483648'/0'/0/0")).toThrow(/Invalid BIP32 path segment/);
    expect(() => splitPath("44'/4294967295/0'/0/0")).toThrow(/Invalid BIP32 path segment/);
  });
});
