import { z } from "zod";
import { CvsApiExtraSchema, SupportedFiatsResponseSchema } from "./schema";

/** The Countervalues Service `/v3/supported/fiat` response (array of tickers). */
export type SupportedFiatsResponse = z.infer<typeof SupportedFiatsResponseSchema>;

/** Thunk `extraArgument` contract for the fiat currency api. */
export type CvsApiExtra = z.infer<typeof CvsApiExtraSchema>;
