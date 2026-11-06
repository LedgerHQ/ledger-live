import type { AnalyticsBalanceRenderProps } from "@features/flow-account-analytics/web";
import { renderHook } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { analyticsFiat } from "../../../__fixtures__/analyticsFixtures";
import { useAnalyticsBalanceRendererViewModel } from "../useAnalyticsBalanceRendererViewModel";

type Balance = AnalyticsBalanceRenderProps["balance"];

const readyBalance: Balance = {
  status: "ready",
  data: {
    amount: 300,
    variation: { amount: 100, ratio: 0.5 },
    history: [
      { timestamp: 1, amount: 200 },
      { timestamp: 2, amount: 300 },
    ],
  },
};

const baseProps = {
  context: {
    assetId: null,
    accountId: null,
    metric: "balance" as const,
    positionIds: [],
    fiatCurrencyId: analyticsFiat.ticker,
    period: "1m" as const,
  },
  catalogStatus: "ready" as const,
  filters: null,
  statusContent: "unavailable",
  positions: [],
};

function renderRendererViewModel(balance: Balance, contextKey = "first") {
  return renderHook(props => useAnalyticsBalanceRendererViewModel({ ...baseProps, ...props }), {
    initialProps: { balance, contextKey },
    initialState: { settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD" } },
  });
}

describe("useAnalyticsBalanceRendererViewModel", () => {
  it("should show the loading chart on the first load", () => {
    const { result } = renderRendererViewModel({ status: "loading" });
    expect(result.current.isChartLoading).toBe(true);
    expect(result.current.variationStatus).toBe("loading");
    expect(result.current.portfolio.balanceHistory).toEqual([]);
  });

  it("should keep the previous chart instead of blanking it while a new selection loads", () => {
    const { result, rerender } = renderRendererViewModel(readyBalance);
    rerender({ balance: { status: "loading" }, contextKey: "second" });
    expect(result.current.isChartLoading).toBe(false);
    expect(result.current.variationStatus).toBe("ready");
    expect(result.current.portfolio.balanceHistory.map(point => point.value)).toEqual([200, 300]);
    expect(result.current.balanceInfo.valueChange).toEqual({ value: 100, percentage: 0.5 });
    expect(result.current.plotContent).toBeUndefined();
  });

  it("should replace the previous chart with the unavailable content", () => {
    const { result, rerender } = renderRendererViewModel(readyBalance);
    rerender({ balance: { status: "unavailable" }, contextKey: "second" });
    expect(result.current.plotContent).toBe("unavailable");
    expect(result.current.portfolio.balanceHistory).toEqual([]);
  });
});
