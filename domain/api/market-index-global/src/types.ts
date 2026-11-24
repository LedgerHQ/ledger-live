import { z } from "zod";
import { GlobalMarketDataResponseSchema } from "./schema";

/** The raw countervalues `/v3/markets/global` response. */
export type GlobalMarketDataResponse = z.infer<typeof GlobalMarketDataResponseSchema>;

export type GlobalMarketDataArgs = {
  /** Fiat or crypto id the market cap is expressed in, sent as the `to` query param. */
  counterCurrency: string;
};
