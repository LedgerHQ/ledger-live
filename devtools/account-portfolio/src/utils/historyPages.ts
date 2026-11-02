import type { AccountPortfolioView } from "../types";

type HistoryView = Extract<AccountPortfolioView, { kind: "history" }>;

/** The history read so far, then the page that follows it: points seen twice are kept once. */
export function mergeHistoryPages(previous: HistoryView, next: HistoryView): HistoryView {
  const seen = new Set<string>();
  const points = [...previous.points, ...next.points].filter(point => {
    const key = `${point.accountId}:${point.asset}:${point.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const failed = new Set(previous.failures.map(failure => failure.accountId));
  return {
    ...next,
    points,
    failures: [
      ...previous.failures,
      ...next.failures.filter(({ accountId }) => !failed.has(accountId)),
    ],
  };
}
