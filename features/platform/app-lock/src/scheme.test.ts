import { resolveAppLockScheme } from "./scheme";

describe("resolveAppLockScheme", () => {
  it("keeps an unmigrated device on the legacy path while the flag is off", () => {
    expect(resolveAppLockScheme({ hasStoredVerifier: false, isRevampEnabled: false })).toBe(
      "legacy",
    );
  });

  it("lets the flag move an unmigrated device onto the new path", () => {
    expect(resolveAppLockScheme({ hasStoredVerifier: false, isRevampEnabled: true })).toBe(
      "revamped",
    );
  });

  it("never sends a migrated device back to legacy, even with the flag off", () => {
    expect(resolveAppLockScheme({ hasStoredVerifier: true, isRevampEnabled: false })).toBe(
      "revamped",
    );
    expect(resolveAppLockScheme({ hasStoredVerifier: true, isRevampEnabled: true })).toBe(
      "revamped",
    );
  });

  it("makes the verifier decisive, not the flag", () => {
    const schemes = [true, false].map(isRevampEnabled =>
      resolveAppLockScheme({ hasStoredVerifier: true, isRevampEnabled }),
    );

    expect(new Set(schemes).size).toBe(1);
  });
});
