import type { z } from "zod";
import type { PortfolioApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Portfolio service. */
export type PortfolioApiExtra = z.infer<typeof PortfolioApiExtraSchema>;
