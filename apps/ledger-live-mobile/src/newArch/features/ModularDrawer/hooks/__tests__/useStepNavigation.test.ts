import { renderHook, act } from "@tests/test-renderer";
import { useStepNavigation } from "../useStepNavigation";
import { ModularDrawerStep } from "../../types";
import type { StepFlowManagerReturnType } from "../useModularDrawerFlowStepManager";
import {
  mockBtcCryptoCurrency,
  arbitrumToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

describe("useStepNavigation", () => {
  const makeStepManager = (
    overrides: Partial<StepFlowManagerReturnType> = {},
  ): StepFlowManagerReturnType => ({
    currentStep: ModularDrawerStep.Asset,
    currentStepIndex: 0,
    goToStep: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("computes back flags based on availability", () => {
    const manager = makeStepManager();
    const { result, rerender } = renderHook(() =>
      useStepNavigation({
        navigationStepManager: manager,
        availableNetworksCount: 2,
        hasOneCurrency: false,
        resetSelection: jest.fn(),
        clearNetwork: jest.fn(),
        navigateToDeviceWithCurrency: jest.fn(),
      }),
    );

    expect(result.current.canGoBackToAsset).toBe(true);
    expect(result.current.canGoBackToNetwork).toBe(true);

    rerender(manager);
  });

  it("backToAsset resets and navigates to Asset", () => {
    const resetSelection = jest.fn();
    const goToStep = jest.fn();
    const localManager = makeStepManager({ goToStep });

    const { result } = renderHook(() =>
      useStepNavigation({
        navigationStepManager: localManager,
        availableNetworksCount: 0,
        hasOneCurrency: false,
        resetSelection,
        clearNetwork: jest.fn(),
        navigateToDeviceWithCurrency: jest.fn(),
      }),
    );

    act(() => result.current.backToAsset());
    expect(resetSelection).toHaveBeenCalled();
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Asset);
  });

  it("backToNetwork clears and navigates to Network", () => {
    const clearNetwork = jest.fn();
    const goToStep = jest.fn();
    const localManager = makeStepManager({ goToStep });

    const { result } = renderHook(() =>
      useStepNavigation({
        navigationStepManager: localManager,
        availableNetworksCount: 2,
        hasOneCurrency: false,
        resetSelection: jest.fn(),
        clearNetwork,
        navigateToDeviceWithCurrency: jest.fn(),
      }),
    );

    act(() => result.current.backToNetwork());
    expect(clearNetwork).toHaveBeenCalled();
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Network);
  });

  it("proceedToNextStep goes to Account when account selection enabled", () => {
    const goToStep = jest.fn();
    const localManager = makeStepManager({ goToStep });
    const { result } = renderHook(() =>
      useStepNavigation({
        navigationStepManager: localManager,
        availableNetworksCount: 2,
        hasOneCurrency: false,
        resetSelection: jest.fn(),
        clearNetwork: jest.fn(),
        enableAccountSelection: true,
        selectNetwork: jest.fn(),
        navigateToDeviceWithCurrency: jest.fn(),
      }),
    );

    act(() => result.current.proceedToNextStep(mockBtcCryptoCurrency, arbitrumToken));
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Account);
  });

  it("proceedToNextStep navigates to device when account selection disabled", () => {
    const navigateToDeviceWithCurrency = jest.fn();
    const manager = makeStepManager();
    const { result } = renderHook(() =>
      useStepNavigation({
        navigationStepManager: manager,
        availableNetworksCount: 2,
        hasOneCurrency: false,
        resetSelection: jest.fn(),
        clearNetwork: jest.fn(),
        enableAccountSelection: false,
        selectNetwork: jest.fn(),
        navigateToDeviceWithCurrency,
      }),
    );

    act(() => result.current.proceedToNextStep(mockBtcCryptoCurrency, arbitrumToken));
    expect(navigateToDeviceWithCurrency).toHaveBeenCalledWith(mockBtcCryptoCurrency);
  });
});
