import { z } from "zod";
import { schemaAccountMetadata } from "./schemas";

export type AccountMetadata = z.infer<typeof schemaAccountMetadata>;
