import { DerivationPathSchema } from "./derivationPath";
import { fromDescriptorPath, LegacyDerivationPathSchema, toDescriptorPath } from "./legacyPath";

describe("legacy path bridges", () => {
  it("reads a legacy path, with or without m/, as a canonical descriptor path", () => {
    expect(toDescriptorPath("44'/60'/0'/0/0")).toBe("m/44h/60h/0h/0/0");
    expect(toDescriptorPath("m/84'/0'/0'")).toBe("m/84h/0h/0h");
  });

  it("rejects what is no path", () => {
    expect(LegacyDerivationPathSchema.safeParse("").success).toBe(false);
    expect(LegacyDerivationPathSchema.safeParse("44'/<account>'").success).toBe(false);
  });

  it("gives the legacy spelling back", () => {
    expect(fromDescriptorPath(DerivationPathSchema.parse("m/44h/60h/0h/0/0"))).toBe(
      "44'/60'/0'/0/0",
    );
  });

  it("keeps a plain string out of a descriptor path", () => {
    // @ts-expect-error a string is no DerivationPath
    expect(fromDescriptorPath("m/44h/60h/0h/0/0")).toBe("44'/60'/0'/0/0");
  });
});
