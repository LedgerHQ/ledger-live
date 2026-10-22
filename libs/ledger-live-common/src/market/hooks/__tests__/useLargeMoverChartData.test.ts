/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useLargeMoverChartData } from "../useLargeMoverChartData";
import { useAssetChartDataInCounterValue } from "../useAssetChartDataInCounterValue";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "../../utils/timers";

jest.mock("../useAssetChartDataInCounterValue", () => ({
  useAssetChartDataInCounterValue: jest.fn(),
}));

const mockUseAssetChartDataInCounterValue = jest.mocked(useAssetChartDataInCounterValue);

describe("useLargeMoverChartData", () => {
  beforeEach(() => {
    mockUseAssetChartDataInCounterValue.mockReturnValue({
      data: undefined,
      currentData: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
    });
  });

  it("polls the chart every three minutes", () => {
    renderHook(() =>
      useLargeMoverChartData({
        id: "bitcoin",
        counterCurrency: "usd",
        range: "24h",
        isCryptoCountervalue: false,
      }),
    );

    expect(mockUseAssetChartDataInCounterValue).toHaveBeenCalledWith(
      {
        id: "bitcoin",
        counterCurrency: "usd",
        range: "24h",
        isCryptoCountervalue: false,
      },
      { skip: false, pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH },
    );
  });
});
