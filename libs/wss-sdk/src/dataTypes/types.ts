import { z } from "zod";
import { schemaWalletDecryptedData } from "./schemas";

export type WalletDecryptedData = z.infer<typeof schemaWalletDecryptedData>;
