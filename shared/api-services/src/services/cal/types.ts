import type { z } from "zod";
import type { CalApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the CAL service. */
export type CalApiExtra = z.infer<typeof CalApiExtraSchema>;
