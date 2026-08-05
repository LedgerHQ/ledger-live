import type { z } from "zod";
import type { CvsApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Countervalues Service. */
export type CvsApiExtra = z.infer<typeof CvsApiExtraSchema>;
