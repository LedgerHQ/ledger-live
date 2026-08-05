import { z } from "zod";
import { SupportedFiatsResponseSchema } from "./schema";

/** The Countervalues Service `/v3/supported/fiat` response (array of tickers). */
export type SupportedFiatsResponse = z.infer<typeof SupportedFiatsResponseSchema>;
