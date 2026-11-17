import { z } from "zod";
import { AggregatedAssetIdSchema, CryptoAssetMetaSchema } from "./schema";

/** Aggregated asset identifier inferred from {@link AggregatedAssetIdSchema}. */
export type AggregatedAssetId = z.infer<typeof AggregatedAssetIdSchema>;

/** Canonical aggregated asset inferred from {@link CryptoAssetMetaSchema}. */
export type CryptoAssetMeta = z.infer<typeof CryptoAssetMetaSchema>;
