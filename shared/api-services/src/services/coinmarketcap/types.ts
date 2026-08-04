import type { z } from "zod";
import type { CoinMarketCapApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the CoinMarketCap service. */
export type CoinMarketCapApiExtra = z.infer<typeof CoinMarketCapApiExtraSchema>;
