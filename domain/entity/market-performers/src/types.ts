import { z } from "zod";
import { MarketItemPerformerSchema } from "./schema";

/** A market performer inferred from {@link MarketItemPerformerSchema}. */
export type MarketItemPerformer = z.infer<typeof MarketItemPerformerSchema>;
