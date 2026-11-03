import { renderHook, waitFor } from "@tests/test-renderer";
import { useAssetChartDataInCounterValue } from "@ledgerhq/live-common/market/hooks/useAssetChartDataInCounterValue";
import { useCurrencyData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useMarketCoinData, useMarketCoinDataWithChart } from "../useMarketCoinData";
import { createMarketCurrencyData, withMarketState } from "../../__tests__/helpers";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/market/hooks/useAssetChartDataInCounterValue");
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useUsdToFiatRate: jest.fn(() => ({ status: "ready", rate: 2 })),
}));

const mockedUseCurrencyData = jest.mocked(useCurrencyData);
const mockedUseAssetChartDataInCounterValue = jest.mocked(useAssetChartDataInCounterValue);

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
      isCryptoCountervalue: false,
    });
    expect(result.current.marketParams).toEqual(
      expect.objectContaining({ counterCurrency: "eur" }),
    );
  });

  it("useMarketCoinData should request USD and rescale a crypto countervalue", async () => {
    mockedUseCurrencyData.mockReturnValue(
      mockCurrencyData({
        data: createMarketCurrencyData({ price: 100, marketcap: 200 }),
      }),
    );

    const { result } = renderHook(
      () => useMarketCoinData({ currencyId: "bitcoin" }),
      withMarketState({ marketParams: { counterCurrency: "btc" } }),
    );

    await waitFor(() => {
      expect(mockedUseCurrencyData).toHaveBeenCalledWith(
        {
          counterCurrency: "usd",
          id: "bitcoin",
        },
        { skip: false },
      );
    });
    expect(result.current.counterCurrency).toBe("btc");
    expect(result.current.currency?.price).toBe(200);
    expect(result.current.currency?.marketcap).toBe(400);
  });

  it("useMarketCoinData should request USD for a fiat outside the chart allowlist", async () => {
    const { result } = renderHook(
      () => useMarketCoinData({ currencyId: "bitcoin" }),
      withMarketState({ marketParams: { counterCurrency: "cop" } }),
    );

    await waitFor(() => {
      expect(mockedUseCurrencyData).toHaveBeenCalledWith(
        {
          counterCurrency: "usd",
          id: "bitcoin",
        },
        { skip: false },
      );
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.currency).toBeDefined();
  });
});
