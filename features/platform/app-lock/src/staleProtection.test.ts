import { isProtectionStale } from "./staleProtection";

describe("protection that outlived its install", () => {
  it("is stale when the running install cannot account for it", () => {
    expect(isProtectionStale({ hasStoredProtection: true, hasKnownInstall: false })).toBe(true);
  });

  it("is not stale for an install that can — the one that set it, or an upgrade of it", () => {
    expect(isProtectionStale({ hasStoredProtection: true, hasKnownInstall: true })).toBe(false);
  });

  it("is not stale when there is no protection to begin with", () => {
    expect(isProtectionStale({ hasStoredProtection: false, hasKnownInstall: false })).toBe(false);
  });
});
