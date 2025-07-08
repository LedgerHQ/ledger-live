import { useInitModularDrawer } from "../useInitModularDrawer";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { renderHook } from "@tests/test-renderer";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook");

describe("useInitModularDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return currencies, sorted cryptos, and ready status when loading is successful", () => {
    const mockEthCryptoCurrency = {
      id: "ethereum",
      name: "Ethereum",
      ticker: "ETH",
      type: "CryptoCurrency",
    } as CryptoOrTokenCurrency;

    const mockBtcCryptoCurrency = {
      id: "bitcoin",
      name: "Bitcoin",
      ticker: "BTC",
      type: "CryptoCurrency",
    } as CryptoOrTokenCurrency;

    const mockCurrenciesByProvider = [
      {
        providerId: "provider1",
        currenciesByNetwork: [mockEthCryptoCurrency],
      },
    ];
    const mockSortedCryptoCurrencies = [mockBtcCryptoCurrency, mockEthCryptoCurrency];
    (
      useGroupedCurrenciesByProvider as jest.MockedFunction<typeof useGroupedCurrenciesByProvider>
    ).mockReturnValue({
      result: {
        currenciesByProvider: mockCurrenciesByProvider,
        sortedCryptoCurrencies: mockSortedCryptoCurrencies,
      },
      loadingStatus: LoadingStatus.Success,
    });

    const { result } = renderHook(() => useInitModularDrawer());
    expect(result.current.currenciesByProvider).toEqual(mockCurrenciesByProvider);
    expect(result.current.sortedCryptoCurrencies).toEqual(mockSortedCryptoCurrencies);
    expect(result.current.isReadyToBeDisplayed).toBe(true);
  });

  it("should return empty arrays and not ready when loading is not successful", () => {
    (
      useGroupedCurrenciesByProvider as jest.MockedFunction<typeof useGroupedCurrenciesByProvider>
    ).mockReturnValue({
      result: {
        currenciesByProvider: [],
        sortedCryptoCurrencies: [],
      },
      loadingStatus: LoadingStatus.Idle,
    });

    const { result } = renderHook(() => useInitModularDrawer());
    expect(result.current.currenciesByProvider).toEqual([]);
    expect(result.current.sortedCryptoCurrencies).toEqual([]);
    expect(result.current.isReadyToBeDisplayed).toBe(false);
  });
});
