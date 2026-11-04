import { parseAnalyticsInitialSelection } from "@features/flow-account-analytics";

export function resolveAnalyticsEntry(state: unknown) {
  if (typeof state !== "object" || state === null || !("accountAnalytics" in state))
    return undefined;
  const entry = state.accountAnalytics;
  if (
    typeof entry !== "object" ||
    entry === null ||
    !("metric" in entry) ||
    entry.metric !== "balance"
  )
    return undefined;
  return parseAnalyticsInitialSelection(entry);
}
