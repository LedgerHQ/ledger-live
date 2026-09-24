import { resolveAppLockScheme } from "./scheme";

describe("resolveAppLockScheme", () => {
  it("is revamped while the flag is on", () => {
    expect(resolveAppLockScheme({ hasStoredProtection: false, isRevampEnabled: true })).toBe(
      "revamped",
    );
  });

  // The rollback case: the alternative is an app that ignores a protection its user set.
  it("stays revamped for stored protection once the flag goes off", () => {
    expect(resolveAppLockScheme({ hasStoredProtection: true, isRevampEnabled: false })).toBe(
      "revamped",
    );
  });

  it("is legacy only when neither holds", () => {
    expect(resolveAppLockScheme({ hasStoredProtection: false, isRevampEnabled: false })).toBe(
      "legacy",
    );
  });
});
