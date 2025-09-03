import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerState } from "../useModularDrawerState";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
  mockCurrencyIds,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigationProp } from "@react-navigation/native";
import { UseAssetsData } from "../useAssetsFromDada";

const assetsSorted: UseAssetsData = [
  {
    asset: {
      id: mockEthCryptoCurrency.id,
      ticker: mockEthCryptoCurrency.ticker,
      name: mockEthCryptoCurrency.name,
      assetsIds: {
        [mockEthCryptoCurrency.id]: mockEthCryptoCurrency.id,
        [mockArbitrumCryptoCurrency.id]: mockArbitrumCryptoCurrency.id,
        [mockBaseCryptoCurrency.id]: mockBaseCryptoCurrency.id,
      },
    },
    networks: [mockEthCryptoCurrency, mockArbitrumCryptoCurrency, mockBaseCryptoCurrency],
    interestRates: undefined,
    market: undefined,
  },
  {
    asset: {
      id: mockBtcCryptoCurrency.id,
      ticker: mockBtcCryptoCurrency.ticker,
      name: mockBtcCryptoCurrency.name,
      assetsIds: {
        [mockBtcCryptoCurrency.id]: mockBtcCryptoCurrency.id,
      },
    },
    networks: [],
    interestRates: undefined,
    market: undefined,
  },
];

const mockNavigate = jest.fn();
const mockNavigation: Partial<NavigationProp<Record<string, never>>> = {
  navigate: mockNavigate,
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize state correctly", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        assetsSorted: [],
        flow: "test",
      }),
    );
    expect(result.current.asset).toBeUndefined();
    expect(result.current.network).toBeUndefined();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should handle asset selection and populate networks when multiple networks exist", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["ethereum", "bitcoin"],
        assetsSorted,
        flow: "test",
      }),
    );

    act(() => {
      result.current.handleAsset(mockEthCryptoCurrency);
    });

    expect(result.current.asset).toEqual(mockEthCryptoCurrency);
    expect(result.current.availableNetworks.length).toBeGreaterThan(1);
  });

  it("should reset state on close", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        assetsSorted,
        flow: "test",
      }),
    );
    act(() => {
      result.current.handleAsset(mockEthCryptoCurrency);
    });
    expect(result.current.asset).toEqual(mockEthCryptoCurrency);
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
        assetsSorted,
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
        assetsSorted,
        flow: "test",
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });

  it("should handle single currency flow", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin"],
        assetsSorted,
        flow: "test",
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });

  it("should handle single currency flow", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin"],
        assetsSorted,
        flow: "test",
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });

  it("should handle multiple currencies", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin", "ethereum"],
        assetsSorted,
        flow: "test",
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });
});
