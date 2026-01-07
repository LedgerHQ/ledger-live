import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerState } from "../useModularDrawerState";
import { ModularDrawerStep } from "../../types";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
  mockBaseCryptoCurrency,
  mockCurrencyIds,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigationProp } from "@react-navigation/native";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { State } from "~/reducers/types";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

const mockOnAccountSelected = jest.fn();

const assetsSorted: AssetData[] = [
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
        onAccountSelected: mockOnAccountSelected,
      }),
    );
    expect(result.current.network).toBeUndefined();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should handle asset selection and populate networks when multiple networks exist", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["ethereum", "bitcoin"],
        assetsSorted,
        onAccountSelected: mockOnAccountSelected,
      }),
    );

    act(() => {
      result.current.handleAsset(mockEthCryptoCurrency);
    });

    expect(result.current.availableNetworks.length).toBeGreaterThan(1);
  });

  it("should reset state on close", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        assetsSorted,
        onAccountSelected: mockOnAccountSelected,
      }),
    );
    act(() => {
      result.current.handleAsset(mockEthCryptoCurrency);
    });
    act(() => {
      result.current.handleCloseButton();
    });
    expect(result.current.network).toBeUndefined();
    expect(result.current.availableNetworks).toEqual([]);
  });

  it("should expose back/close handlers", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: mockCurrencyIds,
        assetsSorted,
        onAccountSelected: mockOnAccountSelected,
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
        onAccountSelected: mockOnAccountSelected,
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });

  it("should set hasOneCurrency to true when a single currency id is provided", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin"],
        assetsSorted,
        onAccountSelected: mockOnAccountSelected,
      }),
    );
    expect(result.current.hasOneCurrency).toBe(true);
  });

  it("should go to Account when there is exactly one network (enableAccountSelection)", () => {
    const singleAsset: AssetData[] = [
      {
        asset: {
          id: mockEthCryptoCurrency.id,
          ticker: mockEthCryptoCurrency.ticker,
          name: mockEthCryptoCurrency.name,
          assetsIds: { [mockEthCryptoCurrency.id]: mockEthCryptoCurrency.id },
        },
        networks: [mockEthCryptoCurrency],
        interestRates: undefined,
        market: undefined,
      },
    ];

    const { store } = renderHook(
      () =>
        useModularDrawerState({
          currencyIds: [mockEthCryptoCurrency.id],
          assetsSorted: singleAsset,
          isDrawerOpen: true,
          onAccountSelected: mockOnAccountSelected,
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

    expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Account);
  });

  it("should navigate to device when there is exactly one network (no account selection)", () => {
    const singleAsset: AssetData[] = [
      {
        asset: {
          id: mockEthCryptoCurrency.id,
          ticker: mockEthCryptoCurrency.ticker,
          name: mockEthCryptoCurrency.name,
          assetsIds: { [mockEthCryptoCurrency.id]: mockEthCryptoCurrency.id },
        },
        networks: [mockEthCryptoCurrency],
        interestRates: undefined,
        market: undefined,
      },
    ];

    const { store } = renderHook(
      () =>
        useModularDrawerState({
          currencyIds: [mockEthCryptoCurrency.id],
          assetsSorted: singleAsset,
          isDrawerOpen: true,
          onAccountSelected: mockOnAccountSelected,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...state.modularDrawer,
            enableAccountSelection: false,
          },
        }),
      },
    );

    expect(store.getState().modularDrawer.step).not.toBe(ModularDrawerStep.Account);
  });

  it("should handle multiple currencies", () => {
    const { result } = renderHook(() =>
      useModularDrawerState({
        currencyIds: ["bitcoin", "ethereum"],
        assetsSorted,
        onAccountSelected: mockOnAccountSelected,
      }),
    );
    expect(result.current.hasOneCurrency).toBe(false);
  });
});
