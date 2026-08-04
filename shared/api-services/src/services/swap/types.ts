import type { z } from "zod";
import type { SwapApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the swap aggregator. */
export type SwapApiExtra = z.infer<typeof SwapApiExtraSchema>;
