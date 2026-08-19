import { isProtectionStale } from "./staleProtection";

describe("isProtectionStale", () => {
  it.each([
    ["protection outlived its install", true, false, true],
    ["protection belongs to this install", true, true, false],
    ["nothing is stored", false, false, false],
    ["a marker is left over from a protection that was turned off", false, true, false],
  ])("%s", (_case, hasStoredProtection, hasInstallMarker, expected) => {
    expect(isProtectionStale({ hasStoredProtection, hasInstallMarker })).toBe(expected);
  });

  it("keeps a reinstalled app open rather than demanding a password for data that is gone", () => {
    expect(isProtectionStale({ hasStoredProtection: true, hasInstallMarker: false })).toBe(true);
  });
});
