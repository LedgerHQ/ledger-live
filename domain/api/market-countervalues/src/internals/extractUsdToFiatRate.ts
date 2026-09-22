import type { SpotSimpleResponse } from "../schema";

/** Picks the USD rate out of a spot payload, tolerating either casing. Null when absent or junk. */
export function extractUsdToFiatRate(res: SpotSimpleResponse): number | null {
  const raw = res.USD ?? res.usd;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return raw;
}
