import type { AltcoinSeasonIndex } from "@domain/entity-market-index-altcoin-season";
import { AltcoinSeasonIndexResponseSchema } from "./schema";

/** Validates the raw CMC response and maps it to the canonical {@link AltcoinSeasonIndex}. */
export function transformAltcoinSeasonIndexResponse(response: unknown): AltcoinSeasonIndex {
  const { data } = AltcoinSeasonIndexResponseSchema.parse(response);
  return {
    value: data.altcoin_index,
    altcoinMarketcap: data.altcoin_marketcap,
  };
}
