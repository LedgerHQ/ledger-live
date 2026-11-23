import { defineRecord } from "@shared/persistence";
import { importMarketBannerState } from "~/reducers/marketBanner";
import type { MarketBannerState, State } from "~/reducers/types";

const STORED_RANKINGS = ["trending", "gainers", "losers", "favorites"] as const;

/** A ranking that the app adds and the schema does not accept fails the typecheck of `encode`. */
type StoredMarketBanner = { ranking: (typeof STORED_RANKINGS)[number] };

export const marketBannerRecord = defineRecord({
  key: "marketBanner",
  version: 0,
  schema: z => z.strictObject({ ranking: z.enum(STORED_RANKINGS) }),
  codec: {
    encode: (marketBanner: MarketBannerState): StoredMarketBanner => ({
      ranking: marketBanner.ranking,
    }),
    decode: stored => stored,
  },
  state: {
    select: (state: Pick<State, "marketBanner">) => state.marketBanner,
    toHydrationAction: importMarketBannerState,
  },
});
