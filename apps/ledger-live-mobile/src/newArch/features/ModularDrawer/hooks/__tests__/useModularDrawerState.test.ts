import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerState } from "../useModularDrawerState";
import { ModularDrawerStep } from "../../types";
import {
  mockEthCryptoCurrency,
  mockBtcCryptoCurrency,
  mockCurrenciesByProvider,
  mockCurrencyIds,
} from "./__mocks__/modularDrawerMocks";

describe("useModularDrawerState", () => {
  const mockCurrency = mockBtcCryptoCurrency;
  const mockNetwork = mockEthCryptoCurrency;

  it("should initialize state correctly", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep: jest.fn(),
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    expect(result.current.asset).toBeNull();
    expect(result.current.network).toBeNull();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should select an asset and go to correct step", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency, mockBtcCryptoCurrency]);
    });
    expect(result.current.asset).toEqual(mockCurrency);
    expect(result.current.availableNetworks.length).toBeGreaterThan(0);
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Network);
  });

  it("should select a network and go to account step", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectNetwork(mockCurrency, mockNetwork);
    });
    expect(result.current.asset).toEqual(mockCurrency);
    expect(result.current.network).toEqual(mockNetwork);
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Account);
  });

  it("should reset state", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep: jest.fn(),
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency]);
      result.current.selectNetwork(mockCurrency, mockEthCryptoCurrency);
      result.current.reset();
    });
    expect(result.current.asset).toBeNull();
    expect(result.current.network).toBeNull();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should go back to asset step", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.backToAsset();
    });
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Asset);
  });

  it("should go back to network step", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.backToNetwork();
    });
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Network);
  });

  it("should handle back from Network step", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.handleBack(ModularDrawerStep.Network);
    });
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Asset);
  });

  it("should handle back from Account step with multiple networks", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency, mockBtcCryptoCurrency]);
      result.current.handleBack(ModularDrawerStep.Account);
    });
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Network);
  });

  it("should handle back from Account step with one network", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency]);
      result.current.handleBack(ModularDrawerStep.Account);
    });
    expect(goToStep).toHaveBeenCalledWith(ModularDrawerStep.Asset);
  });
});
