import { z } from "zod";
import { MarketIndexGlobalSchema } from "./schema";

/** Canonical global market index inferred from {@link MarketIndexGlobalSchema}. */
export type MarketIndexGlobal = z.infer<typeof MarketIndexGlobalSchema>;
