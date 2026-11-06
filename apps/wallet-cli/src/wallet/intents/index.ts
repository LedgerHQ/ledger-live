import { z } from "zod";

import { AmountWithTickerSchema, BitcoinTransactionIntentSchema } from "./families/bitcoin";
import { EvmTransactionIntentSchema } from "./families/evm";
import { SolanaTransactionIntentSchema } from "./families/solana";
import { XrpTransactionIntentSchema } from "./families/xrp";

export { AmountWithTickerSchema, BitcoinTransactionIntentSchema };
export { EvmTransactionIntentSchema };
export { SolanaTransactionIntentSchema };
export { XrpTransactionIntentSchema };

export const TransactionIntentSchema = z.discriminatedUnion("family", [
  BitcoinTransactionIntentSchema,
  EvmTransactionIntentSchema,
  SolanaTransactionIntentSchema,
  XrpTransactionIntentSchema,
]);

export type TransactionIntent = z.infer<typeof TransactionIntentSchema>;

/** The currency families wallet-cli actually supports — keep in sync with the schemas above (one
 * entry per `families/*.ts` file). Other callers (e.g. `ledger-sync/cloud-sync-accounts.ts`) use
 * this as the single source of truth instead of re-listing the supported families themselves. */
export const SUPPORTED_TRANSACTION_FAMILIES = ["bitcoin", "evm", "solana", "xrp"] as const;
