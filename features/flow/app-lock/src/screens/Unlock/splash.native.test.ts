import { isShowingSplash } from "./splash";

describe("standing in for the splash", () => {
  it("does while the biometric prompt is up, so the field never flashes behind it", () => {
    expect(isShowingSplash({ hasPassword: true, isAwaitingBiometrics: true })).toBe(true);
  });

  it("does for a user protected by biometrics alone, refusal included", () => {
    expect(isShowingSplash({ hasPassword: false, isAwaitingBiometrics: false })).toBe(true);
  });

  it("does not once a password user has refused or dismissed biometrics", () => {
    expect(isShowingSplash({ hasPassword: true, isAwaitingBiometrics: false })).toBe(false);
  });
});
