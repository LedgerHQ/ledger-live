import type { AnalyticsBalanceData } from "../../types";
import {
  resolveAnalyticsBalanceSummary,
  type AnalyticsBalanceSummaryInput,
} from "./resolveAnalyticsBalanceSummary";

const data: AnalyticsBalanceData = {
  amount: 10,
  variation: { amount: 1, ratio: 0.1 },
  history: [{ timestamp: 1, amount: 10 }],
};
const fresh = { data, isStale: false };
const base: AnalyticsBalanceSummaryInput = {
  balance: { status: "ready", data },
  catalogStatus: "ready",
  current: { status: "ready", data: 10 },
  retained: fresh,
};

describe("resolveAnalyticsBalanceSummary", () => {
  it("should show a ready balance without any status", () => {
    expect(resolveAnalyticsBalanceSummary(base)).toEqual({
      current: base.current,
      data,
      isCurrentAvailable: true,
      isCatalogLoading: false,
      isChartLoading: false,
      variationStatus: "ready",
      showHeaderStatus: false,
      showPlotStatus: false,
    });
  });

  it("should load the chart without a retained balance", () => {
    const summary = resolveAnalyticsBalanceSummary({
      ...base,
      balance: { status: "loading" },
      retained: { data: undefined, isStale: false },
    });
    expect(summary).toMatchObject({ isChartLoading: true, variationStatus: "loading" });
  });

  it("should keep the retained chart and variation while the next balance loads", () => {
    const summary = resolveAnalyticsBalanceSummary({
      ...base,
      balance: { status: "loading" },
      retained: { data, isStale: true },
    });
    expect(summary).toMatchObject({ data, isChartLoading: false, variationStatus: "ready" });
  });

  it.each(["error", "unavailable"] as const)(
    "should show the status in the plot for a %s balance",
    status => {
      const summary = resolveAnalyticsBalanceSummary({ ...base, balance: { status } });
      expect(summary).toMatchObject({ showPlotStatus: true, variationStatus: "unavailable" });
    },
  );

  it("should show the status in the header when the catalog fails or the current balance is unavailable", () => {
    expect(
      resolveAnalyticsBalanceSummary({ ...base, catalogStatus: "error" }).showHeaderStatus,
    ).toBe(true);
    expect(
      resolveAnalyticsBalanceSummary({ ...base, current: { status: "unavailable" } }),
    ).toMatchObject({ showHeaderStatus: true, isCurrentAvailable: false });
  });

  it("should flag a loading catalog without a header status", () => {
    expect(resolveAnalyticsBalanceSummary({ ...base, catalogStatus: "loading" })).toMatchObject({
      isCatalogLoading: true,
      isCurrentAvailable: false,
      showHeaderStatus: false,
    });
  });
});
