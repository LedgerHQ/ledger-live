/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions */
import type { CantonOnboardProgress } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { of, throwError } from "rxjs";
import { act, renderHook } from "tests/testSetup";
import { useCantonBridge } from "../hooks/useCantonBridge";
import { createMockAccount, createMockCantonCurrency, createMockDevice } from "./testUtils";

describe("useCantonBridge", () => {
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount({ used: false });
  const mockCurrency = createMockCantonCurrency();
  const mockSetOnboardingStatus = jest.fn();
  const mockSetOnboardingResult = jest.fn();
  const mockSetOnboardingError = jest.fn();
  const mockResetError = jest.fn();
  const mockOnOnboardingComplete = jest.fn();

  const createMockBridge = () => ({
    onboardAccount: jest.fn(),
  });

  const defaultParams = (bridgeOverride?: ReturnType<typeof createMockBridge>) => {
    const bridge = bridgeOverride ?? createMockBridge();
    return {
      bridge: bridge as any,
      currency: mockCurrency,
      device: mockDevice,
      accountToOnboard: mockAccount,
      setOnboardingStatus: mockSetOnboardingStatus,
      setOnboardingResult: mockSetOnboardingResult,
      setOnboardingError: mockSetOnboardingError,
      resetError: mockResetError,
      onOnboardingComplete: mockOnOnboardingComplete,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startOnboarding", () => {
    it("should not start onboarding if device is null", () => {
      const mockBridge = createMockBridge();
      const { result } = renderHook(() =>
        useCantonBridge({ ...defaultParams(mockBridge), device: null }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockBridge.onboardAccount).not.toHaveBeenCalled();
    });

    it("should not start onboarding if bridge is null", () => {
      const { result } = renderHook(() => useCantonBridge({ ...defaultParams(), bridge: null }));

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingStatus).not.toHaveBeenCalled();
    });

    it("should not start onboarding if currency is null", () => {
      const { result } = renderHook(() => useCantonBridge({ ...defaultParams(), currency: null }));

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingStatus).not.toHaveBeenCalled();
    });

    it("should not start onboarding if accountToOnboard is undefined", () => {
      const mockBridge = createMockBridge();
      const { result } = renderHook(() =>
        useCantonBridge({ ...defaultParams(mockBridge), accountToOnboard: undefined }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockBridge.onboardAccount).not.toHaveBeenCalled();
    });

    it("should reset error and set PREPARE status when starting onboarding", () => {
      const mockBridge = createMockBridge();
      const mockObservable = of({ status: OnboardStatus.SUBMIT } as CantonOnboardProgress);
      mockBridge.onboardAccount.mockReturnValue(mockObservable);

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockResetError).toHaveBeenCalled();
      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.PREPARE);
      expect(mockBridge.onboardAccount).toHaveBeenCalledWith(
        mockCurrency,
        mockDevice.deviceId,
        mockAccount,
      );
    });

    it("should update status when receiving progress", () => {
      const mockBridge = createMockBridge();
      const progress: CantonOnboardProgress = { status: OnboardStatus.SUBMIT };
      mockBridge.onboardAccount.mockReturnValue(of(progress));

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.SUBMIT);
    });

    it("should handle onboard result and set result", () => {
      const mockBridge = createMockBridge();
      const onboardResult = { partyId: "test-party", account: mockAccount };
      mockBridge.onboardAccount.mockReturnValue(of(onboardResult));

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingResult).toHaveBeenCalledWith({
        partyId: "test-party",
        completedAccount: mockAccount,
      });
      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.SUCCESS);
      expect(mockOnOnboardingComplete).toHaveBeenCalled();
    });

    it("should handle onboarding errors", () => {
      const mockBridge = createMockBridge();
      const testError = new Error("Onboarding failed");
      mockBridge.onboardAccount.mockReturnValue(throwError(() => testError));

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingError).toHaveBeenCalledWith(testError);
    });

    it("should handle exceptions thrown by bridge.onboardAccount", () => {
      const mockBridge = createMockBridge();
      const testError = new Error("Bridge error");
      mockBridge.onboardAccount.mockImplementation(() => {
        throw testError;
      });

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingError).toHaveBeenCalledWith(testError);
    });
  });

  describe("unsubscribe", () => {
    it("should return unsubscribe function", () => {
      const mockBridge = createMockBridge();
      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      expect(result.current.unsubscribe).toBeDefined();
      expect(typeof result.current.unsubscribe).toBe("function");
    });
  });
});
