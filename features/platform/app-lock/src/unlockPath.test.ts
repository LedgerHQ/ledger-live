import { resolveUnlockPath } from "./unlockPath";

describe("resolveUnlockPath", () => {
  it("opens the app when nothing protects it", () => {
    expect(resolveUnlockPath({ hasPassword: false, biometricsEnabled: false })).toEqual({
      kind: "open",
    });
  });

  it("goes to the password screen when only a password is set", () => {
    expect(resolveUnlockPath({ hasPassword: true, biometricsEnabled: false })).toEqual({
      kind: "password",
    });
  });

  it("prefers biometrics, with the password as fallback when both are on", () => {
    expect(resolveUnlockPath({ hasPassword: true, biometricsEnabled: true })).toEqual({
      kind: "biometrics",
      hasPasswordFallback: true,
    });
  });

  it("offers no fallback for a biometrics-only user", () => {
    expect(resolveUnlockPath({ hasPassword: false, biometricsEnabled: true })).toEqual({
      kind: "biometrics",
      hasPasswordFallback: false,
    });
  });

  it("locks a biometrics-only user, which the hasPassword coupling prevents today", () => {
    expect(resolveUnlockPath({ hasPassword: false, biometricsEnabled: true }).kind).not.toBe(
      "open",
    );
  });
});
