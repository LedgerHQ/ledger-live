/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useMarketDataProvider, useSupportedCounterCurrencies } from "../useCoingeckoDataProvider";
import { useGetSupportedCounterCurrenciesQuery } from "../../state-manager/api";
import { ONE_DAY } from "../../constants";

jest.mock("../../state-manager/api", () => ({
  useGetSupportedCounterCurrenciesQuery: jest.fn(),
}));

const mockUseGetSupportedCounterCurrenciesQuery = jest.mocked(
  useGetSupportedCounterCurrenciesQuery,
);

const mockQueryReturn = <TQuery extends (...args: any[]) => any>(
  data?: ReturnType<TQuery>["data"],
): ReturnType<TQuery> =>
  ({ data, isLoading: !data, isSuccess: !!data }) as unknown as ReturnType<TQuery>;

describe("useCoingeckoDataProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetSupportedCounterCurrenciesQuery.mockReturnValue(
      mockQueryReturn<typeof useGetSupportedCounterCurrenciesQuery>(),
    );
  });

  describe("useSupportedCounterCurrencies", () => {
    it("should poll every ONE_DAY", () => {
      renderHook(() => useSupportedCounterCurrencies());

      expect(mockUseGetSupportedCounterCurrenciesQuery).toHaveBeenCalledWith(undefined, {
        pollingInterval: ONE_DAY,
      });
    });
  });

  describe("useMarketDataProvider", () => {
    it("should expose the counter currencies query data", () => {
      const currencies = ["usd", "eur"];

      mockUseGetSupportedCounterCurrenciesQuery.mockReturnValue(
        mockQueryReturn<typeof useGetSupportedCounterCurrenciesQuery>(currencies),
      );

      const { result } = renderHook(() => useMarketDataProvider());

      expect(result.current).toEqual({ supportedCounterCurrencies: currencies });
    });

    it("should return undefined when the query has not resolved yet", () => {
      const { result } = renderHook(() => useMarketDataProvider());

      expect(result.current.supportedCounterCurrencies).toBeUndefined();
    });
  });
});
