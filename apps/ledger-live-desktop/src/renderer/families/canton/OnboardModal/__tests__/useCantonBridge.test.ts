/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions */
import type {
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonOnboardProgress,
} from "@ledgerhq/coin-canton/types";
import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { of, throwError } from "rxjs";
import { act, renderHook } from "tests/testSetup";
import { useCantonBridge } from "../hooks/useCantonBridge";
import {
  createMockAccount,
  createMockCantonCurrency,
  createMockDevice,
  createMockOnboardingResult,
} from "./testUtils";

describe("useCantonBridge", () => {
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount({ used: false });
  const mockCurrency = createMockCantonCurrency();
  const mockSetOnboardingStatus = jest.fn();
  const mockSetAuthorizeStatus = jest.fn();
  const mockSetOnboardingResult = jest.fn();
  const mockSetOnboardingError = jest.fn();
  const mockSetAuthorizationError = jest.fn();
  const mockResetError = jest.fn();
  const mockOnOnboardingComplete = jest.fn();

  const createMockBridge = () => ({
    onboardAccount: jest.fn(),
    authorizePreapproval: jest.fn(),
  });

  const defaultParams = (bridgeOverride?: ReturnType<typeof createMockBridge>) => {
    const bridge = bridgeOverride ?? createMockBridge();
    return {
      bridge: bridge as any,
      currency: mockCurrency,
      device: mockDevice,
      accountToOnboard: mockAccount,
      setOnboardingStatus: mockSetOnboardingStatus,
      setAuthorizeStatus: mockSetAuthorizeStatus,
      setOnboardingResult: mockSetOnboardingResult,
      setOnboardingError: mockSetOnboardingError,
      setAuthorizationError: mockSetAuthorizationError,
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
    });

    it("should call onOnboardingComplete immediately when skipPreapprovalStep is true", () => {
      const mockBridge = createMockBridge();
      const onboardResult = { partyId: "test-party", account: mockAccount };
      mockBridge.onboardAccount.mockReturnValue(of(onboardResult));

      const { result } = renderHook(() =>
        useCantonBridge({ ...defaultParams(mockBridge), skipPreapprovalStep: true }),
      );

      act(() => {
        result.current.startOnboarding();
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

  describe("authorizePreapproval", () => {
    it("should not authorize if device is null", () => {
      const mockBridge = createMockBridge();
      const onboardingResult = createMockOnboardingResult();

      const { result } = renderHook(() =>
        useCantonBridge({ ...defaultParams(mockBridge), device: null }),
      );

      act(() => {
        result.current.authorizePreapproval(onboardingResult);
      });

      expect(mockBridge.authorizePreapproval).not.toHaveBeenCalled();
    });

    it("should reset error and set PREPARE status when starting authorization", () => {
      const mockBridge = createMockBridge();
      const onboardingResult = createMockOnboardingResult();
      const progress: CantonAuthorizeProgress = { status: AuthorizeStatus.SUBMIT };
      mockBridge.authorizePreapproval.mockReturnValue(of(progress));

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.authorizePreapproval(onboardingResult);
      });

      expect(mockResetError).toHaveBeenCalled();
      expect(mockSetAuthorizeStatus).toHaveBeenCalledWith(AuthorizeStatus.PREPARE);
      expect(mockBridge.authorizePreapproval).toHaveBeenCalledWith(
        mockCurrency,
        mockDevice.deviceId,
        onboardingResult.completedAccount,
        onboardingResult.partyId,
      );
    });

    it("should update authorize status when receiving progress", () => {
      const mockBridge = createMockBridge();
      const onboardingResult = createMockOnboardingResult();
      const progress: CantonAuthorizeProgress = { status: AuthorizeStatus.SUBMIT };
      mockBridge.authorizePreapproval.mockReturnValue(of(progress));

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.authorizePreapproval(onboardingResult);
      });

      expect(mockSetAuthorizeStatus).toHaveBeenCalledWith(AuthorizeStatus.SUBMIT);
    });

    it("should complete onboarding when authorization is approved", () => {
      const mockBridge = createMockBridge();
      const onboardingResult = createMockOnboardingResult();
      const authorizeResult: CantonAuthorizeResult = { isApproved: true };
      mockBridge.authorizePreapproval.mockReturnValue(of(authorizeResult));

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.authorizePreapproval(onboardingResult);
      });

      expect(mockSetOnboardingStatus).toHaveBeenCalledWith(OnboardStatus.SUCCESS);
      expect(mockSetAuthorizeStatus).toHaveBeenCalledWith(AuthorizeStatus.SUCCESS);
      expect(mockOnOnboardingComplete).toHaveBeenCalled();
    });

    it("should handle authorization errors", () => {
      const mockBridge = createMockBridge();
      const onboardingResult = createMockOnboardingResult();
      const testError = new Error("Authorization failed");
      mockBridge.authorizePreapproval.mockReturnValue(throwError(() => testError));

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.authorizePreapproval(onboardingResult);
      });

      expect(mockSetAuthorizationError).toHaveBeenCalledWith(testError);
    });

    it("should handle exceptions thrown by bridge.authorizePreapproval", () => {
      const mockBridge = createMockBridge();
      const testError = new Error("Bridge error");
      mockBridge.authorizePreapproval.mockImplementation(() => {
        throw testError;
      });
      const onboardingResult = createMockOnboardingResult();

      const { result } = renderHook(() => useCantonBridge(defaultParams(mockBridge)));

      act(() => {
        result.current.authorizePreapproval(onboardingResult);
      });

      expect(mockSetAuthorizationError).toHaveBeenCalledWith(testError);
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
