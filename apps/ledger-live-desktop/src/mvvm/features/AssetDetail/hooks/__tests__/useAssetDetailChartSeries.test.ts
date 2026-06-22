import { renderHook } from "tests/testSetup";
import { useAssetChartDataInCounterValue } from "@ledgerhq/live-common/market/hooks/useAssetChartDataInCounterValue";
import type { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import { useAssetDetailChartSeries } from "../useAssetDetailChartSeries";
import { buildAssetDetailChartSeries } from "../../utils/buildAssetDetailChartSeries";

jest.mock("@ledgerhq/live-common/market/hooks/useAssetChartDataInCounterValue");
jest.mock("../../utils/buildAssetDetailChartSeries");

const mockedUseAssetChartData = jest.mocked(useAssetChartDataInCounterValue);
const mockedBuildSeries = jest.mocked(buildAssetDetailChartSeries);

const chartData: MarketCoinDataChart = { "1d": [[1, 2]] };

const mockChartData = (overrides: Partial<ReturnType<typeof useAssetChartDataInCounterValue>> = {}) =>
  mockedUseAssetChartData.mockReturnValue({
    data: chartData,
    currentData: chartData,
    isLoading: false,
    isFetching: false,
    isError: false,
    ...overrides,
  });

describe("useAssetDetailChartSeries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChartData();
    mockedBuildSeries.mockReturnValue({ prices: [2], timestamps: [1] });
  });

  describe("counter value fallback", () => {
    it("builds the series from the counter-value-aware chart data and forwards request args", () => {
      const { result } = renderHook(() =>
        useAssetDetailChartSeries({ id: "bitcoin", counterCurrency: "btc", selectedRange: "1d" }),
      );

      // The chart now goes through the USD-fallback wrapper instead of useAssetChartData.
      expect(mockedUseAssetChartData).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "btc", range: "1d" },
        { skip: false },
      );
      // The series is derived from the (rescaled) currentData the wrapper returns.
      expect(mockedBuildSeries).toHaveBeenCalledWith(
        expect.objectContaining({ chartData, selectedRange: "1d" }),
      );
      expect(result.current).toMatchObject({
        prices: [2],
        timestamps: [1],
        isLoading: false,
        isFetching: false,
        isError: false,
      });
    });

    it("skips the request and uses an empty id when no id is provided", () => {
      renderHook(() =>
        useAssetDetailChartSeries({ id: undefined, counterCurrency: "usd", selectedRange: "1d" }),
      );

      expect(mockedUseAssetChartData).toHaveBeenCalledWith(
        { id: "", counterCurrency: "usd", range: "1d" },
        { skip: true },
      );
    });

    it("forwards the loading and error states from the wrapper hook", () => {
      mockChartData({ isLoading: true, isFetching: true, isError: true });

      const { result } = renderHook(() =>
        useAssetDetailChartSeries({ id: "bitcoin", counterCurrency: "cop", selectedRange: "1d" }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isError).toBe(true);
    });
  });
});
