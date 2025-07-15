import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerState } from "../useModularDrawerState";
import { ModularDrawerStep } from "../../types";
import { State } from "~/reducers/types";
import { INITIAL_STATE } from "~/reducers/modularDrawer";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockCurrencyIds,
  mockCurrenciesByProvider,
} from "../../__mocks__/currencies.mock";

describe("useModularDrawerState", () => {
  const mockCurrency = mockBtcCryptoCurrency;
  const mockNetwork = mockEthCryptoCurrency;

  it("should initialize state correctly", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    expect(result.current.selectedAsset).toBeNull();
    expect(result.current.selectedNetwork).toBeNull();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should select an asset and go to correct step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency, mockBtcCryptoCurrency]);
    });
    expect(result.current.selectedAsset).toEqual(mockCurrency);
    expect(result.current.availableNetworks.length).toBeGreaterThan(0);

    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
  });

  it("should select a network and go to account step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectNetwork(mockCurrency, mockNetwork);
    });
    expect(result.current.selectedAsset).toEqual(mockCurrency);
    expect(result.current.selectedNetwork).toEqual(mockNetwork);
  });

  it("should reset state", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency]);
      result.current.selectNetwork(mockCurrency, mockEthCryptoCurrency);
      result.current.resetState();
    });
    expect(result.current.selectedAsset).toBeNull();
    expect(result.current.selectedNetwork).toBeNull();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should go back to asset step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.backToAsset();
    });
    expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
  });

  it("should go back to network step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.backToNetwork();
    });
    expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
  });

  it("should handle back from Network step", () => {
    const { result } = renderHook(
      () =>
        useModularDrawerState({
          currencyIds: mockCurrencyIds,
          currenciesByProvider: mockCurrenciesByProvider,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
            currentStep: ModularDrawerStep.Network,
          },
        }),
      },
    );
    act(() => {
      result.current.handleBack();
    });
    expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
  });
});
