import { renderHook } from "tests/testSetup";
import { createMockMarketCurrencyData } from "@ledgerhq/live-common/market/utils/fixtures";
import { useMarketDataSectionCurrencyData } from "../hooks/useMarketDataSectionCurrencyData";

const hookOptions = () => ({
  minimal: false as const,
  initialState: { settings: { counterValue: "USD" } },
});

describe("useMarketDataSectionCurrencyData", () => {
  it("forwards the resolved market data and adds counter value + locale", () => {
    const marketCurrencyData = createMockMarketCurrencyData();
    const { result } = renderHook(
      () =>
        useMarketDataSectionCurrencyData(
          {
            marketCurrencyData,
            marketId: undefined,
            isLoading: false,
          },
          false,
        ),
      hookOptions(),
    );

    expect(result.current.data).toBe(marketCurrencyData);
    expect(result.current.counterCurrency).toBe("usd");
    expect(result.current.locale).toBeTruthy();
    expect(result.current.showSkeleton).toBe(false);
  });

  it("shows the skeleton while the upstream hook is still loading without data", () => {
    const { result } = renderHook(
      () =>
        useMarketDataSectionCurrencyData(
          {
            marketCurrencyData: undefined,
            marketId: undefined,
            isLoading: true,
          },
          false,
        ),
      hookOptions(),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.showSkeleton).toBe(true);
  });

  it("hides the skeleton as soon as data is available even if the upstream is still refreshing", () => {
    const { result } = renderHook(
      () =>
        useMarketDataSectionCurrencyData(
          {
            marketCurrencyData: createMockMarketCurrencyData(),
            marketId: undefined,
            isLoading: true,
          },
          true,
        ),
      hookOptions(),
    );

    expect(result.current.showSkeleton).toBe(false);
  });

  it("hides the skeleton while distribution is loading when market data is already available", () => {
    const { result } = renderHook(
      () =>
        useMarketDataSectionCurrencyData(
          {
            marketCurrencyData: createMockMarketCurrencyData(),
            marketId: undefined,
            isLoading: false,
          },
          true,
        ),
      hookOptions(),
    );

    expect(result.current.showSkeleton).toBe(false);
  });

  it("does not show the skeleton when neither data nor loading is reported", () => {
    const { result } = renderHook(
      () =>
        useMarketDataSectionCurrencyData(
          {
            marketCurrencyData: undefined,
            marketId: undefined,
            isLoading: false,
          },
          false,
        ),
      hookOptions(),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.showSkeleton).toBe(false);
  });
});
