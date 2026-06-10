import { act, renderHook } from "@tests/test-renderer";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import type { OnboardingState } from "@ledgerhq/live-common/hw/extractOnboardingState";
import useFirstStepCompanionState from "./useFirstStepCompanionState";
import { FirstStepCompanionStepKey } from "../types";

jest.useFakeTimers();

const makeOnboardingState = (
  currentOnboardingStep: OnboardingStep,
  isOnboarded = false,
): OnboardingState =>
  ({
    currentOnboardingStep,
    isOnboarded,
  }) as OnboardingState;

describe("useFirstStepCompanionState", () => {
  const setCompanionStep = jest.fn();
  const setSeedPathStatus = jest.fn();
  const notifyEarlySecurityCheckShouldReset = jest.fn();
  const analyticsSeedConfiguration = { current: undefined };

  const defaultProps = (overrides: Partial<Parameters<typeof useFirstStepCompanionState>[0]> = {}) => ({
    deviceOnboardingState: null,
    activeStep: FirstStepCompanionStepKey.Pin,
    setCompanionStep,
    notifyEarlySecurityCheckShouldReset,
    setSeedPathStatus,
    analyticsSeedConfiguration,
    hasSyncStep: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsSeedConfiguration.current = undefined;
  });

  it("should advance to EarlySecurityCheckCompleted after 400ms when device reaches ChooseName", () => {
    renderHook(() =>
      useFirstStepCompanionState(
        defaultProps({
          activeStep: FirstStepCompanionStepKey.Pin,
          deviceOnboardingState: makeOnboardingState(OnboardingStep.ChooseName),
        }),
      ),
    );

    expect(setCompanionStep).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(setCompanionStep).toHaveBeenCalledWith(
      FirstStepCompanionStepKey.EarlySecurityCheckCompleted,
    );
  });

  it("should advance to Pin after 400ms when active step is EarlySecurityCheckCompleted and device left ChooseName", () => {
    renderHook(() =>
      useFirstStepCompanionState(
        defaultProps({
          activeStep: FirstStepCompanionStepKey.EarlySecurityCheckCompleted,
          deviceOnboardingState: makeOnboardingState(OnboardingStep.Pin),
        }),
      ),
    );

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(setCompanionStep).toHaveBeenCalledWith(FirstStepCompanionStepKey.Pin);
  });

  it("should map SetupChoice to choice_new_or_restore seed path status", () => {
    renderHook(() =>
      useFirstStepCompanionState(
        defaultProps({
          deviceOnboardingState: makeOnboardingState(OnboardingStep.SetupChoice),
        }),
      ),
    );

    expect(setSeedPathStatus).toHaveBeenCalledWith("choice_new_or_restore");
  });

  it("should map NewDevice to new_seed and set analytics seed configuration", () => {
    renderHook(() =>
      useFirstStepCompanionState(
        defaultProps({
          deviceOnboardingState: makeOnboardingState(OnboardingStep.NewDevice),
        }),
      ),
    );

    expect(setSeedPathStatus).toHaveBeenCalledWith("new_seed");
    expect(analyticsSeedConfiguration.current).toBe("new_seed");
  });

  it("should jump to Ready when seeded device is onboarded without sync step", () => {
    renderHook(() =>
      useFirstStepCompanionState(
        defaultProps({
          activeStep: FirstStepCompanionStepKey.Seed,
          hasSyncStep: false,
          deviceOnboardingState: makeOnboardingState(OnboardingStep.Ready, true),
        }),
      ),
    );

    expect(setCompanionStep).toHaveBeenCalledWith(FirstStepCompanionStepKey.Ready);
  });

  it("should jump to Sync when seeded device is onboarded with sync step", () => {
    renderHook(() =>
      useFirstStepCompanionState(
        defaultProps({
          activeStep: FirstStepCompanionStepKey.Seed,
          hasSyncStep: true,
          deviceOnboardingState: makeOnboardingState(OnboardingStep.WelcomeScreen1, true),
        }),
      ),
    );

    expect(setCompanionStep).toHaveBeenCalledWith(FirstStepCompanionStepKey.Sync);
  });
});
