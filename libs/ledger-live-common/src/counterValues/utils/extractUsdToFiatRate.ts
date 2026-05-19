import type { SpotSimpleResponse } from "../state-manager/schema";

/**
 * Read the USD → `to` rate out of a `/v3/spot/simple?froms=usd&to=<to>` payload.
 * Returns `null` when the rate is missing or the payload is malformed.
 *
 * Kept as a standalone function so it can be unit-tested without standing up
 * RTK Query, and so future hardening (NaN/zero guards, alternate `froms` key)
 * lands in a single named place.
 */
export function extractUsdToFiatRate(res: SpotSimpleResponse, to: string): number | null {
  return res?.usd?.[to.toLowerCase()] ?? null;
}
