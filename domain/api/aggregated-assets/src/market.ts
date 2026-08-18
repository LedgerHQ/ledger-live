import type { MarketItemResponse } from "./internals/marketItem";

export type PartialMarketItemResponse = Partial<MarketItemResponse>;

/** Maps an aggregated-asset id such as "ethereum:erc20:usd_tether" to its market id. */
export function dadaIdToMarketId(id: string): string {
  if (!id.includes(":")) return id;
  const lastSegment = id.split(":").pop();
  return lastSegment?.replaceAll("_", "-") ?? id;
}
