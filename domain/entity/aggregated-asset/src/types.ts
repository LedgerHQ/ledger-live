import { z } from "zod";
import { CryptoAssetMetaSchema } from "./schema";

/** Canonical aggregated asset inferred from {@link CryptoAssetMetaSchema}. */
export type CryptoAssetMeta = z.infer<typeof CryptoAssetMetaSchema>;
