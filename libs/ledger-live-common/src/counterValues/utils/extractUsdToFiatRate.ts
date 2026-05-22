import type { SpotSimpleResponse } from "../state-manager/schema";

/**
 * Read the USD spot rate out of a `/v3/spot/simple?froms=usd&to=<to>` payload
 */
export function extractUsdToFiatRate(res: SpotSimpleResponse): number | null {
  if (!res) return null;

  const rate = Object.entries(res).find(([key]) => key.toLowerCase() === "usd")?.[1];

  return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
}
