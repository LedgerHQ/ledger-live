import { z } from "zod";
import type { MarketChartRange } from "@domain/entity-market-chart";
import { MarketChartResponseSchema } from "./schema";

/** The raw countervalues `/v3/markets/chart/{range}/{id}` response. */
export type MarketChartResponse = z.infer<typeof MarketChartResponseSchema>;

export type AssetChartDataArgs = {
  /** Ledger currency id of the asset, e.g. `bitcoin`. */
  id?: string;
  /** Fiat or crypto id the values are expressed in. */
  counterCurrency?: string;
  range?: MarketChartRange;
};
