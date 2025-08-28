import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerState } from "../useModularDrawerState";
import {
  mockBtcCryptoCurrency,
  mockCurrenciesByProvider,
  mockCurrencyIds,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigationProp } from "@react-navigation/native";

const mockNavigate = jest.fn();
const mockNavigation: Partial<NavigationProp<Record<string, never>>> = {
  navigate: mockNavigate,
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the useProviders hook
const mockSetProviders = jest.fn();
const mockGetNetworksFromProvider = jest.fn();
const mockGetProvider: jest.Mock = jest.fn(() => null);
jest.mock("../useProviders", () => ({
  useProviders: () => ({
    providers: null,
    setProviders: mockSetProviders,
    getNetworksFromProvider: mockGetNetworksFromProvider,
  }),
  getProvider: (currency: unknown, providers: unknown) => mockGetProvider(currency, providers),
}));

// Mock the modularDrawer utils
jest.mock("@ledgerhq/live-common/modularDrawer/utils/index", () => ({
  getEffectiveCurrency: jest.fn(currency => currency),
  isCorrespondingCurrency: jest.fn(() => true),
  haveOneCommonProvider: jest.fn(() => false),
}));

// Mock the useModularDrawerFlowStepManager to prevent infinite loops
const mockGoToStep = jest.fn();
const mockResetStepManager = jest.fn();
jest.mock("../useModularDrawerFlowStepManager", () => ({
  useModularDrawerFlowStepManager: () => ({
    currentStep: "asset",
    goToStep: mockGoToStep,
    reset: mockResetStepManager,
  }),
}));

// Mock the useModularDrawerAnalytics to prevent side effects
jest.mock("../../analytics/useModularDrawerAnalytics", () => ({
  useModularDrawerAnalytics: () => ({
    trackModularDrawerEvent: jest.fn(),
  }),
  getCurrentPageName: () => "page",
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

  it("should handle asset selection and populate networks when multiple networks exist", () => {
    mockGetProvider.mockReturnValue({
      providerId: "provider1",
      currenciesByNetwork: [],
    });
    mockGetNetworksFromProvider.mockReturnValue(["ethereum", "bitcoin"]);

    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["ethereum", "bitcoin"],
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );

    act(() => {
      result.current.handleAsset(mockCurrency);
    });

    expect(mockSetProviders).toHaveBeenCalled();
    expect(result.current.asset).toEqual(mockCurrency);
    expect(result.current.availableNetworks.length).toBeGreaterThan(1);
  });

  it("should reset state on close", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    act(() => {
      result.current.handleAsset(mockCurrency);
    });
    expect(result.current.asset).toEqual(mockCurrency);
    act(() => {
      result.current.handleCloseButton();
    });
    expect(result.current.asset).toBeUndefined();
    expect(result.current.network).toBeUndefined();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should expose back/close handlers", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        currenciesByProvider: mockCurrenciesByProvider,
        flow: "test",
      }),
    );
    expect(typeof result.current.handleBackButton).toBe("function");
    expect(typeof result.current.handleCloseButton).toBe("function");
  });

  it("should compute hasOneCurrency as false with provided mocks", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin", "ethereum"],
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
