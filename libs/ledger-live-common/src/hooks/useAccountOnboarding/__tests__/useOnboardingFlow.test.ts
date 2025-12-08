/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { act, renderHook } from "@testing-library/react";
import { Observable, of, throwError } from "rxjs";
import {
  OnboardingBridge,
  OnboardingConfig,
  OnboardProgress,
  OnboardResult,
  StepId,
} from "../types";
import { useOnboardingFlow } from "../useOnboardingFlow";

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

describe("useOnboardingFlow", () => {
  const mockCurrency = {
    id: "canton_network",
    family: "canton",
  } as unknown as CryptoCurrency;

  const mockDeviceId = "device-1";

  const mockCreatableAccount = {
    id: "account-1",
    currency: mockCurrency,
    type: "Account" as const,
  } as unknown as Account;

  const mockCompletedAccount = {
    id: "account-completed",
    currency: mockCurrency,
    type: "Account" as const,
  } as unknown as Account;

  const mockOnboardingConfig: OnboardingConfig = {
    stepFlow: [StepId.ONBOARD, StepId.FINISH],
  };

  const createMockBridge = (
    observable: Observable<OnboardProgress | OnboardResult>,
  ): OnboardingBridge => ({
    onboardAccount: jest.fn(() => observable),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  it("should initialize with correct default state", () => {
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    expect(result.current.stepId).toBe(StepId.ONBOARD);
    expect(result.current.error).toBeNull();
    expect(result.current.onboardingStatus).toBe(AccountOnboardStatus.INIT);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.onboardingResult).toBeUndefined();
  });

  it("should initialize with first step from stepFlow", () => {
    const customConfig = {
      stepFlow: [StepId.FINISH, StepId.ONBOARD],
    };
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: customConfig,
      }),
    );

    expect(result.current.stepId).toBe(StepId.FINISH);
  });

  it("should default to ONBOARD when stepFlow is empty", () => {
    const customConfig = {
      stepFlow: [],
    };
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: customConfig,
      }),
    );

    expect(result.current.stepId).toBe(StepId.ONBOARD);
  });

  it("should set processing state and PREPARE status when called", () => {
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    expect(result.current.isProcessing).toBe(true);
    expect(result.current.onboardingStatus).toBe(AccountOnboardStatus.PREPARE);
    expect(result.current.error).toBeNull();
  });

  it("should call onboardAccount with correct parameters", () => {
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    expect(mockBridge.onboardAccount).toHaveBeenCalledWith(
      mockCurrency,
      mockDeviceId,
      mockCreatableAccount,
    );
  });

  it("should handle onboarding success flow", () => {
    const successResult: OnboardResult = {
      account: mockCompletedAccount,
      metadata: { partyId: "test-party-id" },
    };
    const mockBridge = createMockBridge(of(successResult));
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    expect(result.current.onboardingStatus).toBe(AccountOnboardStatus.SUCCESS);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.onboardingResult).toEqual({
      completedAccount: mockCompletedAccount,
      metadata: { partyId: "test-party-id" },
    });
  });

  it("should handle progress updates", () => {
    const progress: OnboardProgress = { status: AccountOnboardStatus.SIGN };
    const successResult: OnboardResult = {
      account: mockCompletedAccount,
    };

    const mockBridge = createMockBridge(of(progress, successResult));
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    expect(result.current.onboardingStatus).toBe(AccountOnboardStatus.SUCCESS);
    expect(result.current.onboardingResult).toBeDefined();
  });

  it("should handle onboarding error", () => {
    const testError = new Error("Onboarding failed");
    const mockBridge = createMockBridge(throwError(() => testError));
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    expect(result.current.onboardingStatus).toBe(AccountOnboardStatus.ERROR);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(testError);
    expect(consoleErrorSpy).toHaveBeenCalledWith("[handleOnboardAccount] failed", testError);
  });

  it("should cleanup previous subscription when called multiple times", () => {
    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();

    let subscriptionCount = 0;
    const mockBridge: OnboardingBridge = {
      onboardAccount: jest.fn(() => {
        subscriptionCount++;
        return new Observable(_subscriber => {
          if (subscriptionCount === 1) {
            return { unsubscribe: unsubscribe1 };
          }
          return { unsubscribe: unsubscribe2 };
        });
      }),
    };

    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    act(() => {
      result.current.handleOnboardAccount();
    });

    // First subscription should be cleaned up
    expect(unsubscribe1).toHaveBeenCalled();
  });

  it("should reset all state to initial values", () => {
    const successResult: OnboardResult = {
      account: mockCompletedAccount,
    };
    const mockBridge = createMockBridge(of(successResult));
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    // First, complete an onboarding
    act(() => {
      result.current.handleOnboardAccount();
    });

    expect(result.current.onboardingStatus).toBe(AccountOnboardStatus.SUCCESS);
    expect(result.current.onboardingResult).toBeDefined();

    // Then retry
    act(() => {
      result.current.handleRetryOnboardAccount();
    });

    expect(result.current.stepId).toBe(StepId.ONBOARD);
    expect(result.current.error).toBeNull();
    expect(result.current.onboardingStatus).toBe(AccountOnboardStatus.INIT);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.onboardingResult).toBeUndefined();
  });

  it("should reset stepId to first step in stepFlow", () => {
    const customConfig = {
      stepFlow: [StepId.FINISH, StepId.ONBOARD],
    };
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: customConfig,
      }),
    );

    act(() => {
      result.current.transitionTo(StepId.FINISH);
    });

    act(() => {
      result.current.handleRetryOnboardAccount();
    });

    expect(result.current.stepId).toBe(StepId.FINISH);
  });

  it("should cleanup subscription when retrying", () => {
    const unsubscribe = jest.fn();
    const mockBridge: OnboardingBridge = {
      onboardAccount: jest.fn(
        () =>
          new Observable(() => ({
            unsubscribe,
          })),
      ),
    };

    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    act(() => {
      result.current.handleRetryOnboardAccount();
    });

    expect(unsubscribe).toHaveBeenCalled();
  });

  it("should transition to valid step", () => {
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.transitionTo(StepId.FINISH);
    });

    expect(result.current.stepId).toBe(StepId.FINISH);
  });

  it("should not transition to invalid step and log error", () => {
    const customConfig = {
      stepFlow: [StepId.ONBOARD],
    };
    const mockBridge = createMockBridge(of());
    const { result } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: customConfig,
      }),
    );

    const initialStepId = result.current.stepId;

    act(() => {
      result.current.transitionTo(StepId.FINISH);
    });

    expect(result.current.stepId).toBe(initialStepId);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid step transition"),
    );
  });

  it("should cleanup subscription on unmount", () => {
    const unsubscribe = jest.fn();
    const mockBridge: OnboardingBridge = {
      onboardAccount: jest.fn(
        () =>
          new Observable(() => ({
            unsubscribe,
          })),
      ),
    };

    const { result, unmount } = renderHook(() =>
      useOnboardingFlow({
        creatableAccount: mockCreatableAccount,
        currency: mockCurrency,
        deviceId: mockDeviceId,
        onboardingBridge: mockBridge,
        onboardingConfig: mockOnboardingConfig,
      }),
    );

    act(() => {
      result.current.handleOnboardAccount();
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
