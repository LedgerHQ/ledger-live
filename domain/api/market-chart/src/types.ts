import { z } from "zod";
import { MarketChartResponseSchema } from "./schema";

/** The raw countervalues `/v3/markets/chart/{range}/{id}` response. */
export type MarketChartResponse = z.infer<typeof MarketChartResponseSchema>;

export type AssetChartDataArgs = {
  /** Ledger currency id of the asset, e.g. `bitcoin`. */
  id?: string;
  /** Fiat or crypto id the values are expressed in. */
  counterCurrency?: string;
  /** A UI range such as `24h` or `7d`. Unknown ranges are fetched as one day, as before. */
  range?: string;
};
