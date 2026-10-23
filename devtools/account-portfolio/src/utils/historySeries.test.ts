import type { PortfolioHistoryPointView } from "../types";
import { historyChartPoints, historyChartScale } from "./historySeries";

const point = (asset: string, time: string, currencyValue?: number): PortfolioHistoryPointView => ({
  network: "base",
  asset,
  amount: "1",
  currencyValue,
  accountId: "a",
  time,
});

describe("historyChartPoints", () => {
  it("adds the assets that share an instant", () => {
    expect(
      historyChartPoints([
        point("eth", "2026-01-01T00:00:00Z", 10),
        point("usdc", "2026-01-01T00:00:00Z", 5),
      ]),
    ).toEqual([{ time: Date.parse("2026-01-01T00:00:00Z"), fiat: 15 }]);
  });

  it("keeps the last known worth of an asset missing at an instant", () => {
    const chart = historyChartPoints([
      point("eth", "2026-01-01T00:00:00Z", 10),
      point("usdc", "2026-01-01T00:00:00Z", 5),
      point("eth", "2026-01-02T00:00:00Z", 20),
    ]);
    expect(chart.map(p => p.fiat)).toEqual([15, 25]);
  });

  it("orders by time and ignores points without a value", () => {
    const chart = historyChartPoints([
      point("eth", "2026-01-02T00:00:00Z", 2),
      point("eth", "2026-01-01T00:00:00Z", 1),
      point("eth", "2026-01-03T00:00:00Z"),
    ]);
    expect(chart.map(p => p.fiat)).toEqual([1, 2]);
  });
});

describe("historyChartScale", () => {
  it("labels a rising series from its top value down to its bottom value", () => {
    expect(historyChartScale([0, 100], 3)).toEqual({
      minValue: 0,
      valueSpan: 100,
      labels: [100, 50, 0],
    });
  });

  it("puts a constant series on its own value, including a zero balance", () => {
    expect(historyChartScale([100, 100], 3).labels).toEqual([101, 100.5, 100]);
    expect(historyChartScale([0, 0], 3).labels).toEqual([1, 0.5, 0]);
  });
});
