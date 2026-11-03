/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useMarketCounterValueRate } from "../useMarketCounterValueRate";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import { useGetSupportedChartCounterCurrenciesQuery } from "../../state-manager/api";

jest.mock("@features/platform-market-countervalues", () => ({
  useUsdToFiatRate: jest.fn(),
}));
jest.mock("../../state-manager/api", () => ({
  useGetSupportedChartCounterCurrenciesQuery: jest.fn(),
}));

const mockUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);
const mockUseGetSupportedChartCounterCurrenciesQuery = jest.mocked(
  useGetSupportedChartCounterCurrenciesQuery,
);

describe("useMarketCounterValueRate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 2 });
    mockUseGetSupportedChartCounterCurrenciesQuery.mockReturnValue({
      data: ["usd", "eur", "btc"],
      isError: false,
    } as unknown as ReturnType<typeof useGetSupportedChartCounterCurrenciesQuery>);
  });

  it("passes a supported fiat through with a rate of 1", () => {
    const { result } = renderHook(() =>
      useMarketCounterValueRate({ counterCurrency: "EUR", isCryptoCountervalue: false }),
    );

    expect(result.current.requestCounterCurrency).toBe("eur");
    expect(result.current.displayCounterCurrency).toBe("eur");
    expect(result.current.rate).toBe(1);
    expect(result.current.supportedCounterCurrencies).toEqual(["usd", "eur", "btc"]);
    expect(result.current.isLoading).toBe(false);
    expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: false });
  });

  it("requests USD and exposes the fiat rate when the ticker is absent", () => {
    const { result } = renderHook(() =>
      useMarketCounterValueRate({ counterCurrency: "cop", isCryptoCountervalue: false }),
    );

    expect(result.current.requestCounterCurrency).toBe("usd");
    expect(result.current.displayCounterCurrency).toBe("cop");
    expect(result.current.rate).toBe(2);
    expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("cop", { skip: false });
  });

  it("falls back to USD for a crypto counter value even when its ticker is listed", () => {
    const { result } = renderHook(() =>
      useMarketCounterValueRate({
        counterCurrency: "btc",
        fallbackForCryptoCountervalues: true,
        isCryptoCountervalue: true,
      }),
    );

    expect(result.current.requestCounterCurrency).toBe("usd");
    expect(result.current.rate).toBe(2);
    expect(result.current.isResolutionLoading).toBe(false);
  });

  it("withholds the rate while it is loading", () => {
    mockUseUsdToFiatRate.mockReturnValue({ status: "loading", rate: null });

    const { result } = renderHook(() =>
      useMarketCounterValueRate({ counterCurrency: "cop", isCryptoCountervalue: false }),
    );

    expect(result.current.rate).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it("skips the rate request when asked to", () => {
    renderHook(() =>
      useMarketCounterValueRate({
        counterCurrency: "cop",
        isCryptoCountervalue: false,
        skip: true,
      }),
    );

    expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("cop", { skip: true });
  });
});
