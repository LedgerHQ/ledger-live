import { reportsSetupDone } from "./deviceReady";
import { OnboardingStep, RecoveryKeyStatus, type DeviceOnboardingState } from "./types";

function state(overrides: Partial<DeviceOnboardingState>): DeviceOnboardingState {
  return {
    isOnboarded: true,
    isInRecoveryMode: false,
    managerAllowed: false,
    currentOnboardingStep: OnboardingStep.Ready,
    seedWordIndex: 0,
    seedPhraseWordCount: 24,
    recoveryKeyStatus: null,
    ...overrides,
  };
}

describe("reportsSetupDone", () => {
  it("should be done on the ready step", () => {
    expect(reportsSetupDone(state({}), false)).toBe(true);
  });

  it("should not be done while the Recovery Key backup runs", () => {
    expect(reportsSetupDone(state({ recoveryKeyStatus: RecoveryKeyStatus.Running }), false)).toBe(
      false,
    );
  });

  it("should not be done on an unknown status while the backup screen is open", () => {
    expect(reportsSetupDone(state({ recoveryKeyStatus: RecoveryKeyStatus.Unknown }), true)).toBe(
      false,
    );
  });

  it("should not be done on a setup step", () => {
    expect(reportsSetupDone(state({ currentOnboardingStep: OnboardingStep.Pin }), false)).toBe(
      false,
    );
    expect(reportsSetupDone(null, false)).toBe(false);
  });
});
