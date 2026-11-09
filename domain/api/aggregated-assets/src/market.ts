import { z } from "zod";
import { AggregatedAssetIdSchema, type AggregatedAssetId } from "@domain/entity-aggregated-asset";
import type { MarketItemResponse } from "./internals/marketItem";

export type PartialMarketItemResponse = Partial<MarketItemResponse>;

/** Market api identifier, such as `usd-coin`: the `/asset/:id` route and the market `ids` filter. */
export const MarketIdSchema = z.string().brand<"MarketId">();

export type MarketId = z.infer<typeof MarketIdSchema>;

const AGGREGATED_ASSET_ID_SEPARATOR = ":";

function isAggregatedAssetRef(raw: string): boolean {
  return raw.includes(AGGREGATED_ASSET_ID_SEPARATOR);
}

/**
 * Entry point for a raw string from legacy code or a route param: an id containing ":" is an
 * aggregated asset id, any other is a market id. Brands with the schemas' parse, never a cast.
 */
export function parseMarketRef(raw: string): AggregatedAssetId | MarketId {
  return isAggregatedAssetRef(raw) ? AggregatedAssetIdSchema.parse(raw) : MarketIdSchema.parse(raw);
}

/**
 * Maps an aggregated asset id such as `ethereum:erc20:usd_tether` to its market id (`usd-tether`).
 * An id without ":" is already a market id and is returned unchanged.
 */
export function toMarketId(id: AggregatedAssetId | MarketId): MarketId {
  if (!isAggregatedAssetRef(id)) return MarketIdSchema.parse(id);
  const lastSegment = id.split(AGGREGATED_ASSET_ID_SEPARATOR).pop() ?? id;
  return MarketIdSchema.parse(lastSegment.replaceAll("_", "-"));
}
