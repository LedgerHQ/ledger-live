import type { AccountPortfolioView, PortfolioHistoryPointView } from "../types";
import { mergeHistoryPages } from "./historyPages";

type HistoryView = Extract<AccountPortfolioView, { kind: "history" }>;

const point = (time: string): PortfolioHistoryPointView => ({
  network: "base",
  asset: "eth",
  amount: "1",
  accountId: "a",
  time,
});

const page = (times: string[], nextToken?: string): HistoryView => ({
  kind: "history",
  points: times.map(point),
  failures: [],
  hasMore: nextToken !== undefined,
  nextToken,
});

describe("mergeHistoryPages", () => {
  it("appends the next page and takes its token", () => {
    const merged = mergeHistoryPages(page(["1", "2"], "t1"), page(["3"], "t2"));
    expect(merged.points.map(p => p.time)).toEqual(["1", "2", "3"]);
    expect(merged.nextToken).toBe("t2");
    expect(merged.hasMore).toBe(true);
  });

  it("keeps a point once when two pages share it, and ends on the last page", () => {
    const merged = mergeHistoryPages(page(["1", "2"], "t1"), page(["2", "3"]));
    expect(merged.points.map(p => p.time)).toEqual(["1", "2", "3"]);
    expect(merged.hasMore).toBe(false);
    expect(merged.nextToken).toBeUndefined();
  });
});
