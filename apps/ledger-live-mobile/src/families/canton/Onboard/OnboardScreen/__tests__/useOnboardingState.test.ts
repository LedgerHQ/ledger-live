import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { act, renderHook } from "@tests/test-renderer";
import { useOnboardingState } from "../hooks/useOnboardingState";

describe("useOnboardingState", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useOnboardingState());

    expect(result.current.onboardingStatus).toBe(OnboardStatus.INIT);
    expect(result.current.authorizeStatus).toBe(AuthorizeStatus.INIT);
    expect(result.current.onboardResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.accountsProcessed).toBe(false);
  });

  it("should update onboarding status", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setOnboardingStatus(OnboardStatus.PREPARE);
    });

    expect(result.current.onboardingStatus).toBe(OnboardStatus.PREPARE);
  });

  it("should update authorization status", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.setAuthorizeStatus(AuthorizeStatus.SIGN);
    });

    expect(result.current.authorizeStatus).toBe(AuthorizeStatus.SIGN);
  });

  it("should set onboarding error and status to ERROR", () => {
    const { result } = renderHook(() => useOnboardingState());
    const testError = new Error("Test error");

    act(() => {
      result.current.setOnboardingError(testError);
    });

    expect(result.current.error).toBe(testError);
    expect(result.current.onboardingStatus).toBe(OnboardStatus.ERROR);
  });

  it("should set authorization error and status to ERROR", () => {
    const { result } = renderHook(() => useOnboardingState());
    const testError = new Error("Test error");

    act(() => {
      result.current.setAuthorizationError(testError);
    });

    expect(result.current.error).toBe(testError);
    expect(result.current.authorizeStatus).toBe(AuthorizeStatus.ERROR);
  });

  it("should reset error", () => {
    const { result } = renderHook(() => useOnboardingState());
    const testError = new Error("Test error");

    act(() => {
      result.current.setOnboardingError(testError);
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should mark accounts as processed", () => {
    const { result } = renderHook(() => useOnboardingState());

    act(() => {
      result.current.markAccountsProcessed();
    });

    expect(result.current.accountsProcessed).toBe(true);
  });
});
