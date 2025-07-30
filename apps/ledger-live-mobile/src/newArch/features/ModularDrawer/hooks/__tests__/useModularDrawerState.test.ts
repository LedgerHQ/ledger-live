import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerState } from "../useModularDrawerState";
import { ModularDrawerStep } from "../../types";
import {
  mockBtcCryptoCurrency,
  mockCurrenciesByProvider,
  mockCurrencyIds,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(),
  isFocused: jest.fn(),
  getParent: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the useProviders hook
const mockSetProviders = jest.fn();
const mockGetNetworksFromProvider = jest.fn();
jest.mock("../useProviders", () => ({
  useProviders: () => ({
    providers: null,
    setProviders: mockSetProviders,
    getNetworksFromProvider: mockGetNetworksFromProvider,
  }),
  getProvider: jest.fn(() => null),
}));

// Mock the modularDrawer utils
jest.mock("@ledgerhq/live-common/modularDrawer/utils/index", () => ({
  getEffectiveCurrency: jest.fn(currency => currency),
  isCorrespondingCurrency: jest.fn(() => true),
  haveOneCommonProvider: jest.fn(() => false),
}));

// Mock the useModularDrawerFlowStepManager to prevent infinite loops
jest.mock("../useModularDrawerFlowStepManager", () => ({
  useModularDrawerFlowStepManager: () => ({
    currentStep: "asset",
    goToStep: jest.fn(),
    reset: jest.fn(),
  }),
}));

// Mock the useModularDrawerAnalytics to prevent side effects
jest.mock("../../analytics/useModularDrawerAnalytics", () => ({
  useModularDrawerAnalytics: () => ({
    trackModularDrawerEvent: jest.fn(),
  }),
}));

describe("useModularDrawerState", () => {
  const mockCurrency = mockBtcCryptoCurrency;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize state correctly", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    expect(result.current.asset).toBeUndefined();
    expect(result.current.network).toBeUndefined();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should select an asset and go to correct step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency, mockBtcCryptoCurrency]);
    });
    expect(result.current.asset).toEqual(mockCurrency);
    expect(result.current.availableNetworks.length).toBeGreaterThan(0);
  });

  it("should reset state", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency]);
      result.current.selectNetwork(mockCurrency, mockEthCryptoCurrency);
      result.current.reset();
    });
    expect(result.current.asset).toBeUndefined();
    expect(result.current.network).toBeUndefined();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should go back to asset step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.backToAsset();
    });
    // Test that the state is reset
    expect(result.current.asset).toBeUndefined();
    expect(result.current.network).toBeUndefined();
  });

  it("should go back to network step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.backToNetwork();
    });
    // Test that network is cleared
    expect(result.current.network).toBeUndefined();
  });

  it("should handle back from Network step", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.handleBack(ModularDrawerStep.Network);
    });
    // Test that the state is reset when going back from network
    expect(result.current.asset).toBeUndefined();
  });

  it("should handle back from Account step with multiple networks", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency, mockBtcCryptoCurrency]);
      result.current.handleBack(ModularDrawerStep.Account);
    });
    // Test that we go back to network step when multiple networks are available
    expect(result.current.network).toBeUndefined();
  });

  it("should handle back from Account step with one network", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency, [mockEthCryptoCurrency]);
      result.current.handleBack(ModularDrawerStep.Account);
    });
    // Test that we go back to asset step when only one network is available
    expect(result.current.asset).toBeUndefined();
  });

  // test handleSingleCurrencyFlow
  //todo: adapt this test to the new modular drawer flow

  it("should handle single currency flow", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin"],
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });

  it("should handle single currency flow", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin"],
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });

  it("should handle multiple currencies", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin", "ethereum"],
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });
});
