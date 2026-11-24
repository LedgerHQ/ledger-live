import { z } from "zod";
import { GlobalMarketResponseSchema } from "./schema";

export type GlobalMarketResponse = z.infer<typeof GlobalMarketResponseSchema>;

export interface GlobalMarketDataRequestParams {
  counterCurrency: string;
}
