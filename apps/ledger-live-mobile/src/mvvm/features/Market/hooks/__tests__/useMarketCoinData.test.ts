import { renderHook, waitFor } from "@tests/test-renderer";
import { useCurrencyData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useMarketCoinData } from "../useMarketCoinData";
import { createMarketCurrencyData, withMarketState } from "../../__tests__/helpers";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useUsdToFiatRate: jest.fn(() => ({ status: "ready", rate: 2 })),
}));

const mockedUseCurrencyData = jest.mocked(useCurrencyData);

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

  it("useMarketCoinData should expose loading state and refetch", () => {
    const { result } = renderHook(() => useMarketCoinData({ currencyId: "bitcoin" }));

    expect(result.current.loading).toBe(false);
    expect(typeof result.current.refetch).toBe("function");
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
