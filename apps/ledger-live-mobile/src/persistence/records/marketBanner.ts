import { defineRecord, recordVersions } from "@shared/persistence";
import { importMarketBannerState } from "~/reducers/marketBanner";
import type { MarketBannerState, State } from "~/reducers/types";

const STORED_RANKINGS = ["trending", "gainers", "losers", "favorites"] as const;

/** A ranking that the app adds and the schema does not accept fails the typecheck of `encode`. */
type StoredMarketBanner = { ranking: (typeof STORED_RANKINGS)[number] };

export const marketBannerVersions = recordVersions(z =>
  z.strictObject({ ranking: z.enum(STORED_RANKINGS) }),
);

export const marketBannerRecord = defineRecord({
  key: "marketBanner",
  versions: marketBannerVersions,
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
