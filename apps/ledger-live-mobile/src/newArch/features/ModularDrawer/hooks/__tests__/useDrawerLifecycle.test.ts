import { renderHook, act } from "@tests/test-renderer";
import { useDrawerLifecycle } from "../useDrawerLifecycle";
import { ModularDrawerStep } from "../../types";
import type { StepFlowManagerReturnType } from "../useModularDrawerFlowStepManager";

jest.mock("../../analytics/useModularDrawerAnalytics", () => ({
  useModularDrawerAnalytics: () => ({
    trackModularDrawerEvent: jest.fn(),
  }),
  getCurrentPageName: () => "page",
}));

describe("useDrawerLifecycle", () => {
  const navigationStepManager: StepFlowManagerReturnType = {
    currentStep: ModularDrawerStep.Account,
    currentStepIndex: 2,
    reset: jest.fn(),
    goToStep: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("back button prefers network when available, else asset", () => {
    const backToAsset = jest.fn();
    const backToNetwork = jest.fn();
    const { result } = renderHook(() =>
      useDrawerLifecycle({
        flow: "test",
        navigationStepManager,
        canGoBackToAsset: true,
        canGoBackToNetwork: true,
        backToAsset,
        backToNetwork,
        resetSelection: jest.fn(),
      }),
    );

    act(() => result.current.handleBackButton());
    expect(backToNetwork).toHaveBeenCalled();

    const result2 = renderHook(() =>
      useDrawerLifecycle({
        flow: "test",
        navigationStepManager,
        canGoBackToAsset: true,
        canGoBackToNetwork: false,
        backToAsset,
        backToNetwork,
        resetSelection: jest.fn(),
      }),
    );
    act(() => result2.result.current.handleBackButton());
    expect(backToAsset).toHaveBeenCalled();
  });

  it("close button resets and calls onClose", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const { result } = renderHook(() =>
      useDrawerLifecycle({
        flow: "test",
        navigationStepManager,
        canGoBackToAsset: false,
        canGoBackToNetwork: false,
        backToAsset: jest.fn(),
        backToNetwork: jest.fn(),
        onClose,
        resetSelection,
      }),
    );

    act(() => result.current.handleCloseButton());
    expect(resetSelection).toHaveBeenCalled();
    expect(navigationStepManager.reset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
