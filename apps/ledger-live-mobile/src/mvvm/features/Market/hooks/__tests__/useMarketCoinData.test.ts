import { renderHook } from "@tests/test-renderer";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { useAssetChartDataInCounterValue } from "@ledgerhq/live-common/market/hooks/useAssetChartDataInCounterValue";
import { useResolveMarketCounterCurrency } from "@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency";
import { useCurrencyData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useMarketCoinData, useMarketCoinDataWithChart } from "../useMarketCoinData";
import { createMarketCurrencyData, withMarketState } from "../../__tests__/helpers";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/market/hooks/useAssetChartDataInCounterValue");
jest.mock("@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency");
jest.mock("@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate");

const mockedUseCurrencyData = jest.mocked(useCurrencyData);
const mockedUseAssetChartDataInCounterValue = jest.mocked(useAssetChartDataInCounterValue);
const mockedUseResolveMarketCounterCurrency = jest.mocked(useResolveMarketCounterCurrency);
const mockedUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);

const refetch = jest.fn();

function mockCurrencyData(
  overrides: Partial<ReturnType<typeof useCurrencyData>> = {},
): ReturnType<typeof useCurrencyData> {
  return {
    data: createMarketCurrencyData(),
    isFetching: false,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useCurrencyData>;
}

describe("useMarketCoinData hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseResolveMarketCounterCurrency.mockImplementation(({ counterCurrency }) => ({
      requestCounterCurrency: counterCurrency?.toLowerCase(),
      displayCounterCurrency: counterCurrency?.toLowerCase(),
      needsUsdFallback: false,
      isResolutionLoading: false,
      supportedCounterCurrencies: ["usd", "eur"],
    }));
    mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 });
    mockedUseCurrencyData.mockReturnValue(mockCurrencyData());
    mockedUseAssetChartDataInCounterValue.mockReturnValue({
      data: { prices: [[1, 2]] },
      currentData: { prices: [[1, 2]] },
      isLoading: false,
      isFetching: false,
      isError: false,
    });
  });

  it.each([
    { counterCurrency: "eur", expected: "eur" },
    { counterCurrency: undefined, expected: "usd" },
  ])(
    "useMarketCoinData should return counterCurrency=$expected when Redux value is $counterCurrency",
    ({ counterCurrency, expected }) => {
      const { result } = renderHook(
        () => useMarketCoinData({ currencyId: "bitcoin" }),
        withMarketState({ marketParams: { counterCurrency } }),
      );

      expect(result.current.counterCurrency).toBe(expected);
    },
  );

  it.each([
    { range: "7d" as const, expected: "7d" },
    { range: undefined, expected: "24h" },
  ])(
    "useMarketCoinDataWithChart should return range=$expected when Redux value is $range",
    ({ range, expected }) => {
      const { result } = renderHook(
        () => useMarketCoinDataWithChart({ currencyId: "bitcoin" }),
        withMarketState({ marketParams: { range } }),
      );

      expect(result.current.range).toBe(expected);
    },
  );

  it("useMarketCoinData should expose loading state and refetch", () => {
    const { result } = renderHook(() => useMarketCoinData({ currencyId: "bitcoin" }));

    expect(result.current.loading).toBe(false);
    expect(typeof result.current.refetch).toBe("function");
  });

  it("useMarketCoinDataWithChart should expose marketParams and counterCurrency from Redux", () => {
    const { result } = renderHook(
      () => useMarketCoinDataWithChart({ currencyId: "bitcoin" }),
      withMarketState({ marketParams: { counterCurrency: "eur" } }),
    );

    expect(result.current.counterCurrency).toBe("eur");
    expect(mockedUseAssetChartDataInCounterValue).toHaveBeenCalledWith({
      counterCurrency: "eur",
      id: "bitcoin",
      range: "24h",
    });
    expect(result.current.marketParams).toEqual(
      expect.objectContaining({ counterCurrency: "eur" }),
    );
  });

  it("useMarketCoinData should request USD and rescale coin data for crypto countervalues", () => {
    mockedUseResolveMarketCounterCurrency.mockReturnValue({
      requestCounterCurrency: "usd",
      displayCounterCurrency: "btc",
      needsUsdFallback: true,
      isResolutionLoading: false,
      supportedCounterCurrencies: undefined,
    });
    mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.00001 });
    mockedUseCurrencyData.mockReturnValue(
      mockCurrencyData({
        data: createMarketCurrencyData({
          price: 100,
          marketcap: 200,
          totalVolume: 300,
          high24h: 120,
          low24h: 90,
          ath: 150,
          atl: 50,
        }),
      }),
    );

    const { result } = renderHook(
      () => useMarketCoinData({ currencyId: "bitcoin" }),
      withMarketState({ marketParams: { counterCurrency: "btc" } }),
    );

    expect(mockedUseCurrencyData).toHaveBeenCalledWith({
      counterCurrency: "usd",
      id: "bitcoin",
    }, { skip: false });
    expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("btc", { skip: false });
    expect(result.current.counterCurrency).toBe("btc");
    expect(result.current.currency?.price).toBeCloseTo(0.001);
    expect(result.current.currency?.marketcap).toBeCloseTo(0.002);
    expect(result.current.currency?.totalVolume).toBeCloseTo(0.003);
    expect(result.current.currency?.high24h).toBeCloseTo(0.0012);
    expect(result.current.currency?.low24h).toBeCloseTo(0.0009);
    expect(result.current.currency?.ath).toBeCloseTo(0.0015);
    expect(result.current.currency?.atl).toBeCloseTo(0.0005);
  });

  it("useMarketCoinData should skip the native request while countervalue resolution is loading", () => {
    mockedUseResolveMarketCounterCurrency.mockReturnValue({
      requestCounterCurrency: "cop",
      displayCounterCurrency: "cop",
      needsUsdFallback: false,
      isResolutionLoading: true,
      supportedCounterCurrencies: undefined,
    });

    const { result } = renderHook(
      () => useMarketCoinData({ currencyId: "bitcoin" }),
      withMarketState({ marketParams: { counterCurrency: "cop" } }),
    );

    expect(mockedUseCurrencyData).toHaveBeenCalledWith(
      {
        counterCurrency: "cop",
        id: "bitcoin",
      },
      { skip: true },
    );
    expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: true });
    expect(result.current.loading).toBe(true);
    expect(result.current.currency).toBeUndefined();
  });
});
