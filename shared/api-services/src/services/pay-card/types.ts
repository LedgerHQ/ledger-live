import type { z } from "zod";
import type { PayCardApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Pay Card API. */
export type PayCardApiExtra = z.infer<typeof PayCardApiExtraSchema>;
