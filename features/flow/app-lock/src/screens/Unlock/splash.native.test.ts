import { isOfferingBiometricsRetry, isShowingSplash } from "./splash";

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

describe("offering the biometric prompt again", () => {
  it("does once the prompt has gone and left the user looking at a bare screen", () => {
    expect(
      isOfferingBiometricsRetry({ canRetryBiometrics: true, isAwaitingBiometrics: false }),
    ).toBe(true);
  });

  it("does not while the prompt is up, which would put a button under the system dialog", () => {
    expect(
      isOfferingBiometricsRetry({ canRetryBiometrics: true, isAwaitingBiometrics: true }),
    ).toBe(false);
  });

  it("does not for a user with no biometrics to offer", () => {
    expect(
      isOfferingBiometricsRetry({ canRetryBiometrics: false, isAwaitingBiometrics: false }),
    ).toBe(false);
  });
});
