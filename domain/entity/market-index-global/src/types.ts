import { z } from "zod";
import { MarketIndexGlobalSchema } from "./schema";

/** Global market snapshot inferred from {@link MarketIndexGlobalSchema}. */
export type MarketIndexGlobal = z.infer<typeof MarketIndexGlobalSchema>;
