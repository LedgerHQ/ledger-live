import { resolveAppLockScheme } from "./scheme";

describe("resolveAppLockScheme", () => {
  it("is revamped while the flag is on", () => {
    expect(resolveAppLockScheme({ hasStoredVerifier: false, isRevampEnabled: true })).toBe(
      "revamped",
    );
  });

  it("stays revamped for a stored verifier once the flag goes off", () => {
    expect(resolveAppLockScheme({ hasStoredVerifier: true, isRevampEnabled: false })).toBe(
      "revamped",
    );
  });

  it("is legacy only when neither holds", () => {
    expect(resolveAppLockScheme({ hasStoredVerifier: false, isRevampEnabled: false })).toBe(
      "legacy",
    );
  });
});
