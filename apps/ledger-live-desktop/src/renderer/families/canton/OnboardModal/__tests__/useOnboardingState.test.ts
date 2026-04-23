import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { act, renderHook } from "tests/testSetup";
import { useOnboardingState } from "../hooks/useOnboardingState";

describe("useOnboardingState", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useOnboardingState());

    expect(result.current.onboardingStatus).toBe(OnboardStatus.INIT);
    expect(result.current.onboardingResult).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should update onboarding status", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setOnboardingStatus(OnboardStatus.PREPARE);
    });

    expect(result.current.onboardingStatus).toBe(OnboardStatus.PREPARE);
  });

  it("should set onboarding error and status to ERROR", () => {
    const { result } = renderHook(() => useOnboardingState());
    const error = new Error("onboard failed");

    act(() => {
      result.current.setOnboardingError(error);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.onboardingStatus).toBe(OnboardStatus.ERROR);
  });

  it("should not change status when setting null error", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setOnboardingStatus(OnboardStatus.PREPARE);
    });

    act(() => {
      result.current.setOnboardingError(null);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.onboardingStatus).toBe(OnboardStatus.PREPARE);
  });

  it("should reset error", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setOnboardingError(new Error("failed"));
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.resetError();
    });
    expect(result.current.error).toBeNull();
  });

  it("should reset full onboarding state", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setOnboardingStatus(OnboardStatus.SUCCESS);
      result.current.setOnboardingError(new Error("err"));
    });

    act(() => {
      result.current.resetOnboarding();
    });

    expect(result.current.onboardingStatus).toBe(OnboardStatus.INIT);
    expect(result.current.onboardingResult).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
