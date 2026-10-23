import type { PortfolioHistoryPointView } from "../types";
import { historySeries } from "./historySeries";

const point = (
  time: string,
  currencyValue: number | undefined,
  asset = "eth",
): PortfolioHistoryPointView => ({
  network: "ethereum",
  asset,
  calId: asset,
  amount: "1",
  accountId: "a",
  time,
  currencyValue,
});

describe("historySeries", () => {
  it("adds up the points that share a time and puts the times in order", () => {
    const { samples } = historySeries([
      point("2026-01-02T00:00:00Z", 5, "eth"),
      point("2026-01-01T00:00:00Z", 10, "eth"),
      point("2026-01-02T00:00:00Z", 7, "usdc"),
    ]);

    expect(samples).toEqual([
      { time: Date.parse("2026-01-01T00:00:00Z"), value: 10 },
      { time: Date.parse("2026-01-02T00:00:00Z"), value: 12 },
    ]);
  });

  it("counts the points it cannot place", () => {
    const { samples, skipped } = historySeries([
      point("2026-01-01T00:00:00Z", undefined),
      point("not a date", 3),
      point("2026-01-01T00:00:00Z", 3),
    ]);

    expect(samples).toHaveLength(1);
    expect(skipped).toBe(2);
  });
});
