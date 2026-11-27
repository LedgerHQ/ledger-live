/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useGetAssetChartDataQuery } from "@domain/api-market-chart";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "../../utils/timers";
import { useAssetChartData } from "../useAssetChartData";

jest.mock("@domain/api-market-chart", () => ({
  ...jest.requireActual("@domain/api-market-chart"),
  useGetAssetChartDataQuery: jest.fn(),
}));

const mockUseGetAssetChartDataQuery = jest.mocked(useGetAssetChartDataQuery);

describe("useAssetChartData", () => {
  it("polls every three minutes by default", () => {
    renderHook(() => useAssetChartData({ id: "bitcoin", counterCurrency: "usd", range: "24h" }));

    expect(mockUseGetAssetChartDataQuery).toHaveBeenCalledWith(
      { id: "bitcoin", counterCurrency: "usd", range: "24h" },
      { pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH, skip: undefined },
    );
  });

  it("uses a supplied polling interval", () => {
    renderHook(() =>
      useAssetChartData(
        { id: "bitcoin", counterCurrency: "usd", range: "24h" },
        { pollingInterval: 1_000 },
      ),
    );

    expect(mockUseGetAssetChartDataQuery).toHaveBeenCalledWith(
      { id: "bitcoin", counterCurrency: "usd", range: "24h" },
      { pollingInterval: 1_000, skip: undefined },
    );
  });

  it("omits an unknown range so the endpoint uses its default", () => {
    renderHook(() => useAssetChartData({ id: "bitcoin", counterCurrency: "usd", range: "2y" }));

    expect(mockUseGetAssetChartDataQuery).toHaveBeenCalledWith(
      { id: "bitcoin", counterCurrency: "usd", range: undefined },
      expect.anything(),
    );
  });
});
