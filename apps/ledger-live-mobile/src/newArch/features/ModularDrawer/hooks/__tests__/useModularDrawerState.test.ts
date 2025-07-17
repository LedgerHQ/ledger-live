import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerState } from "../useModularDrawerState";
import { ModularDrawerStep } from "../../types";
import {
  mockBtcCryptoCurrency,
  mockCurrenciesByProvider,
  mockCurrencyIds,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";

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
}));

describe("useModularDrawerState", () => {
  const mockCurrency = mockBtcCryptoCurrency;

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  // test handleSingleCurrencyFlow
  it("should handle single currency flow", () => {
    const goToStep = jest.fn();
    const { result } = renderHook(() =>
      useModularDrawerState({
        goToStep,
        currencyIds: [mockCurrency.id],
        currenciesByProvider: mockCurrenciesByProvider,
      }),
    );
    act(() => {
      result.current.selectAsset(mockCurrency);
    });
    expect(result.current.asset).toEqual(mockCurrency);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.DeviceSelection, {
      screen: ScreenName.SelectDevice,
      params: {
        currency: mockCurrency,
        createTokenAccount: false,
        context: AddAccountContexts.AddAccounts,
      },
    });
  });
});
