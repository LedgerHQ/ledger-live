/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import {
  useMarketDataProvider,
  useCurrencyChartData,
  useSupportedCounterCurrencies,
  useSupportedCurrencies,
} from "../useCoingeckoDataProvider";
import {
  useGetSupportedCoinsListQuery,
  useGetSupportedCounterCurrenciesQuery,
  useGetCurrencyChartDataQuery,
} from "../../state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH, ONE_DAY } from "../../constants";

jest.mock("../../state-manager/api", () => ({
  useGetSupportedCoinsListQuery: jest.fn(),
  useGetSupportedCounterCurrenciesQuery: jest.fn(),
  useGetCurrencyChartDataQuery: jest.fn(),
}));

const mockUseGetSupportedCoinsListQuery = jest.mocked(useGetSupportedCoinsListQuery);
const mockUseGetSupportedCounterCurrenciesQuery = jest.mocked(
  useGetSupportedCounterCurrenciesQuery,
);
const mockUseGetCurrencyChartDataQuery = jest.mocked(useGetCurrencyChartDataQuery);

const mockQueryReturn = (data?: unknown) =>
  ({ data, isLoading: !data, isSuccess: !!data }) as ReturnType<
    | typeof useGetSupportedCoinsListQuery
    | typeof useGetSupportedCounterCurrenciesQuery
    | typeof useGetCurrencyChartDataQuery
  >;

describe("useCoingeckoDataProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetSupportedCoinsListQuery.mockReturnValue(mockQueryReturn());
    mockUseGetSupportedCounterCurrenciesQuery.mockReturnValue(mockQueryReturn());
    mockUseGetCurrencyChartDataQuery.mockReturnValue(mockQueryReturn());
  });

  describe("useSupportedCurrencies", () => {
    it("should poll every ONE_DAY", () => {
      renderHook(() => useSupportedCurrencies());

      expect(mockUseGetSupportedCoinsListQuery).toHaveBeenCalledWith(undefined, {
        pollingInterval: ONE_DAY,
      });
    });
  });

  describe("useSupportedCounterCurrencies", () => {
    it("should poll every ONE_DAY", () => {
      renderHook(() => useSupportedCounterCurrencies());

      expect(mockUseGetSupportedCounterCurrenciesQuery).toHaveBeenCalledWith(undefined, {
        pollingInterval: ONE_DAY,
      });
    });
  });

  describe("useCurrencyChartData", () => {
    it("should forward params and poll every 3 minutes", () => {
      renderHook(() =>
        useCurrencyChartData({ id: "bitcoin", counterCurrency: "usd", range: "7d" }),
      );

      expect(mockUseGetCurrencyChartDataQuery).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "usd", range: "7d" },
        { pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH },
      );
    });
  });

  describe("useMarketDataProvider", () => {
    it("should compose both queries and expose their data", () => {
      const coins = [{ id: "bitcoin", name: "Bitcoin", symbol: "btc" }];
      const currencies = ["usd", "eur"];

      mockUseGetSupportedCoinsListQuery.mockReturnValue(mockQueryReturn(coins));
      mockUseGetSupportedCounterCurrenciesQuery.mockReturnValue(mockQueryReturn(currencies));

      const { result } = renderHook(() => useMarketDataProvider());

      expect(result.current).toEqual({
        supportedCurrencies: coins,
        supportedCounterCurrencies: currencies,
      });
    });

    it("should return undefined when queries have not resolved yet", () => {
      const { result } = renderHook(() => useMarketDataProvider());

      expect(result.current.supportedCurrencies).toBeUndefined();
      expect(result.current.supportedCounterCurrencies).toBeUndefined();
    });
  });
});
