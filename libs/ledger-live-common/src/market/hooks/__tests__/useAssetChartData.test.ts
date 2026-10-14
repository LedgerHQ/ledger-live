/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useGetAssetChartDataQuery } from "../../state-manager/api";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "../../utils/timers";
import { useAssetChartData } from "../useAssetChartData";

jest.mock("../../state-manager/api", () => ({
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
});
