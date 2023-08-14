import { z } from "zod";
import { schemaAccountMetadata } from "./Account/1.0.0/schemas";

export const schemaWalletDecryptedData = z.array(schemaAccountMetadata);
