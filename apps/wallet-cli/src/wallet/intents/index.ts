import { z } from "zod";

import { AmountWithTickerSchema, BitcoinTransactionIntentSchema } from "./families/bitcoin";
import { EvmTransactionIntentSchema } from "./families/evm";
import { SolanaTransactionIntentSchema } from "./families/solana";

export { AmountWithTickerSchema, BitcoinTransactionIntentSchema };
export { EvmTransactionIntentSchema };
export { SolanaTransactionIntentSchema };

export const TransactionIntentSchema = z.discriminatedUnion("family", [
  BitcoinTransactionIntentSchema,
  EvmTransactionIntentSchema,
  SolanaTransactionIntentSchema,
]);

export type TransactionIntent = z.infer<typeof TransactionIntentSchema>;
