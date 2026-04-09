import { z } from "zod";

export { AmountWithTickerSchema } from "./families/bitcoin";
export { BitcoinTransactionIntentSchema } from "./families/bitcoin";
export { EvmTransactionIntentSchema } from "./families/evm";
export { SolanaTransactionIntentSchema } from "./families/solana";

import { BitcoinTransactionIntentSchema } from "./families/bitcoin";
import { EvmTransactionIntentSchema } from "./families/evm";
import { SolanaTransactionIntentSchema } from "./families/solana";

export const TransactionIntentSchema = z.discriminatedUnion("family", [
  BitcoinTransactionIntentSchema,
  EvmTransactionIntentSchema,
  SolanaTransactionIntentSchema,
]);

export type TransactionIntent = z.infer<typeof TransactionIntentSchema>;
