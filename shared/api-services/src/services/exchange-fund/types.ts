import type { z } from "zod";
import type { ExchangeFundApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the exchange transaction manager. */
export type ExchangeFundApiExtra = z.infer<typeof ExchangeFundApiExtraSchema>;
