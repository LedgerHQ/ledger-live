import { renderHook, act } from "@tests/test-renderer";
import { useStepNavigation } from "../useStepNavigation";
import { ModularDrawerStep } from "../../types";
import {
  mockBtcCryptoCurrency,
  arbitrumToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { State } from "~/reducers/types";

describe("useStepNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("computes back flags based on availability", () => {
    const { result } = renderHook(
      () =>
        useStepNavigation({
          availableNetworksCount: 2,
          hasOneCurrency: false,
          resetSelection: jest.fn(),
          clearNetwork: jest.fn(),
          navigateToDeviceWithCurrency: jest.fn(),
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...state.modularDrawer,
            step: ModularDrawerStep.Account,
          },
        }),
      },
    );

    expect(result.current.canGoBackToAsset).toBe(true);
    expect(result.current.canGoBackToNetwork).toBe(true);
  });

  it("backToAsset resets and navigates to Asset", () => {
    const resetSelection = jest.fn();
    const { result, store } = renderHook(() =>
      useStepNavigation({
        availableNetworksCount: 0,
        hasOneCurrency: false,
        resetSelection,
        clearNetwork: jest.fn(),
        navigateToDeviceWithCurrency: jest.fn(),
      }),
    );

    act(() => result.current.backToAsset());
    expect(resetSelection).toHaveBeenCalled();
    expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Asset);
  });

  it("backToNetwork clears and navigates to Network", () => {
    const clearNetwork = jest.fn();
    const { result, store } = renderHook(() =>
      useStepNavigation({
        availableNetworksCount: 2,
        hasOneCurrency: false,
        resetSelection: jest.fn(),
        clearNetwork,
        navigateToDeviceWithCurrency: jest.fn(),
      }),
    );

    act(() => result.current.backToNetwork());
    expect(clearNetwork).toHaveBeenCalled();
    expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Network);
  });

  it("proceedToNextStep goes to Account when account selection enabled", () => {
    const { result, store } = renderHook(
      () =>
        useStepNavigation({
          availableNetworksCount: 2,
          hasOneCurrency: false,
          resetSelection: jest.fn(),
          clearNetwork: jest.fn(),
          selectNetwork: jest.fn(),
          navigateToDeviceWithCurrency: jest.fn(),
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...state.modularDrawer,
            enableAccountSelection: true,
          },
        }),
      },
    );

    act(() => result.current.proceedToNextStep(mockBtcCryptoCurrency, arbitrumToken));
    expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Account);
  });

  it("proceedToNextStep navigates to device when account selection disabled", () => {
    const navigateToDeviceWithCurrency = jest.fn();
    const { result } = renderHook(() =>
      useStepNavigation({
        availableNetworksCount: 2,
        hasOneCurrency: false,
        resetSelection: jest.fn(),
        clearNetwork: jest.fn(),
        selectNetwork: jest.fn(),
        navigateToDeviceWithCurrency,
      }),
    );

    act(() => result.current.proceedToNextStep(mockBtcCryptoCurrency, arbitrumToken));
    expect(navigateToDeviceWithCurrency).toHaveBeenCalledWith(mockBtcCryptoCurrency);
  });
});
