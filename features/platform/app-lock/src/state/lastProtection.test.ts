import { isLastProtection } from "./lastProtection";

const protection = (hasPassword: boolean, biometricsEnabled: boolean) => ({
  hasPassword,
  biometricsEnabled,
});

describe("telling whether a protection is the last one", () => {
  it("the password is, where it protects the app alone", () => {
    expect(isLastProtection(protection(true, false), "password")).toBe(true);
  });

  it("biometrics are, where they protect the app alone", () => {
    expect(isLastProtection(protection(false, true), "biometrics")).toBe(true);
  });

  it("neither is, where both are on", () => {
    expect(isLastProtection(protection(true, true), "password")).toBe(false);
    expect(isLastProtection(protection(true, true), "biometrics")).toBe(false);
  });

  // Nothing to be the last of, and nothing to remove either.
  it("neither is, where the app is unprotected", () => {
    expect(isLastProtection(protection(false, false), "password")).toBe(false);
    expect(isLastProtection(protection(false, false), "biometrics")).toBe(false);
  });

  it("a protection that is not on cannot be the last, whatever the other one does", () => {
    expect(isLastProtection(protection(false, true), "password")).toBe(false);
    expect(isLastProtection(protection(true, false), "biometrics")).toBe(false);
  });
});
