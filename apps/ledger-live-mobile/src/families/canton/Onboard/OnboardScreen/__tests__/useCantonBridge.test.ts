/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type {
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonOnboardProgress,
} from "@ledgerhq/coin-canton/types";
import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { act, renderHook } from "@tests/test-renderer";
import { of, throwError } from "rxjs";
import { useCantonBridge } from "../hooks/useCantonBridge";
import {
  createMockAccount,
  createMockCurrency,
  createMockDevice,
  createMockOnboardResult,
} from "./test-utils";

describe("useCantonBridge", () => {
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount();
  const mockCryptoCurrency = createMockCurrency() as CryptoCurrency;
  const mockSetOnboardingStatus = jest.fn();
  const mockSetAuthorizeStatus = jest.fn();
  const mockSetResult = jest.fn();
  const mockSetOnboardingError = jest.fn();
  const mockSetAuthorizationError = jest.fn();
  const mockResetError = jest.fn();
  const mockFinishOnboarding = jest.fn();

  const createMockBridge = () => ({
    onboardAccount: jest.fn(),
    authorizePreapproval: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startOnboarding", () => {
    it("should not start onboarding if device is null", () => {
      const mockBridge = createMockBridge();
      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: null,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockBridge.onboardAccount).not.toHaveBeenCalled();
    });

    it("should not start onboarding if accountToOnboard is undefined", () => {
      const mockBridge = createMockBridge();
      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: undefined,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
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

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockResetError).toHaveBeenCalled();
      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.PREPARE);
      expect(mockBridge.onboardAccount).toHaveBeenCalledWith(
        mockCryptoCurrency,
        mockDevice.deviceId,
        mockAccount,
      );
    });

    it("should update status when receiving progress", () => {
      const mockBridge = createMockBridge();
      const progress: CantonOnboardProgress = { status: OnboardStatus.SUBMIT };
      const mockObservable = of(progress);
      mockBridge.onboardAccount.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.SUBMIT);
    });

    it("should handle onboard result and set result", () => {
      const mockBridge = createMockBridge();
      const onboardResult = createMockOnboardResult();
      const mockObservable = of(onboardResult);
      mockBridge.onboardAccount.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockResetError).toHaveBeenCalledTimes(2);
      expect(mockSetResult).toHaveBeenCalledWith(onboardResult);
      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.INIT);
    });

    it("should finish onboarding immediately when skipPreapprovalStep is true", () => {
      const mockBridge = createMockBridge();
      const onboardResult = createMockOnboardResult();
      const mockObservable = of(onboardResult);
      mockBridge.onboardAccount.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
          skipPreapprovalStep: true,
        }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.SUCCESS);
      expect(mockFinishOnboarding).toHaveBeenCalledWith(onboardResult);
    });

    it("should handle onboarding errors", () => {
      const mockBridge = createMockBridge();
      const testError = new Error("Onboarding failed");
      const mockObservable = throwError(() => testError);
      mockBridge.onboardAccount.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

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

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.startOnboarding();
      });

      expect(mockSetOnboardingError).toHaveBeenCalledWith(testError);
    });
  });

  describe("authorizePreapproval", () => {
    it("should not authorize if device is null", () => {
      const mockBridge = createMockBridge();
      const onboardResult = createMockOnboardResult();

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: null,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.authorizePreapproval(onboardResult);
      });

      expect(mockBridge.authorizePreapproval).not.toHaveBeenCalled();
    });

    it("should reset error and set PREPARE status when starting authorization", () => {
      const mockBridge = createMockBridge();
      const onboardResult = createMockOnboardResult();
      const progress: CantonAuthorizeProgress = { status: AuthorizeStatus.SUBMIT };
      const mockObservable = of(progress);
      mockBridge.authorizePreapproval.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.authorizePreapproval(onboardResult);
      });

      expect(mockResetError).toHaveBeenCalled();
      expect(mockSetAuthorizeStatus).toHaveBeenCalledWith(AuthorizeStatus.PREPARE);
      expect(mockBridge.authorizePreapproval).toHaveBeenCalledWith(
        mockCryptoCurrency,
        mockDevice.deviceId,
        onboardResult.account,
        onboardResult.partyId,
      );
    });

    it("should update authorize status when receiving progress", () => {
      const mockBridge = createMockBridge();
      const onboardResult = createMockOnboardResult();
      const progress: CantonAuthorizeProgress = { status: AuthorizeStatus.SUBMIT };
      const mockObservable = of(progress);
      mockBridge.authorizePreapproval.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.authorizePreapproval(onboardResult);
      });

      expect(mockSetAuthorizeStatus).toHaveBeenCalledWith(AuthorizeStatus.SUBMIT);
    });

    it("should finish onboarding when authorization is approved", () => {
      const mockBridge = createMockBridge();
      const onboardResult = createMockOnboardResult();
      const authorizeResult: CantonAuthorizeResult = { isApproved: true };
      const mockObservable = of(authorizeResult);
      mockBridge.authorizePreapproval.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.authorizePreapproval(onboardResult);
      });

      expect(mockResetError).toHaveBeenCalledTimes(2);
      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.SUCCESS);
      expect(mockSetAuthorizeStatus).toHaveBeenCalledWith(AuthorizeStatus.SUCCESS);
      expect(mockFinishOnboarding).toHaveBeenCalledWith(onboardResult);
    });

    it("should handle authorization errors", () => {
      const mockBridge = createMockBridge();
      const onboardResult = createMockOnboardResult();
      const testError = new Error("Authorization failed");
      const mockObservable = throwError(() => testError);
      mockBridge.authorizePreapproval.mockReturnValue(mockObservable);

      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      act(() => {
        result.current.authorizePreapproval(onboardResult);
      });

      expect(mockSetAuthorizationError).toHaveBeenCalledWith(testError);
    });
  });

  describe("unsubscribe", () => {
    it("should return unsubscribe function", () => {
      const mockBridge = createMockBridge();
      const { result } = renderHook(() =>
        useCantonBridge({
          bridge: mockBridge as any,
          cryptoCurrency: mockCryptoCurrency,
          device: mockDevice,
          accountToOnboard: mockAccount,
          setOnboardingStatus: mockSetOnboardingStatus,
          setAuthorizeStatus: mockSetAuthorizeStatus,
          setResult: mockSetResult,
          setOnboardingError: mockSetOnboardingError,
          setAuthorizationError: mockSetAuthorizationError,
          resetError: mockResetError,
          finishOnboarding: mockFinishOnboarding,
        }),
      );

      expect(result.current.unsubscribe).toBeDefined();
      expect(typeof result.current.unsubscribe).toBe("function");
    });
  });
});
