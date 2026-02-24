/**
 * OperationHistory domain – Zod schemas and inferred types.
 * Supports progressive pagination: optional nextPagingToken for "load more" from API.
 * OperationSchema: value/fee as string (serializable); parse to BigNumber when needed.
 */
import { z } from "zod";

/** Matches OperationType from @ledgerhq/types-live. */
export const OperationTypeSchema = z.enum([
  "IN",
  "OUT",
  "NONE",
  "CREATE",
  "REVEAL",
  "UNKNOWN",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "REWARD",
  "FEES",
  "FREEZE",
  "UNFREEZE",
  "WITHDRAW_EXPIRE_UNFREEZE",
  "UNDELEGATE_RESOURCE",
  "LEGACY_UNFREEZE",
  "VOTE",
  "REWARD_PAYOUT",
  "BOND",
  "UNBOND",
  "WITHDRAW_UNBONDED",
  "SET_CONTROLLER",
  "SLASH",
  "NOMINATE",
  "CHILL",
  "APPROVE",
  "OPT_IN",
  "OPT_OUT",
  "LOCK",
  "UNLOCK",
  "WITHDRAW",
  "REVOKE",
  "ACTIVATE",
  "REGISTER",
  "NFT_IN",
  "NFT_OUT",
  "STAKE",
  "UNSTAKE",
  "WITHDRAW_UNSTAKED",
  "BURN",
  "ASSOCIATE_TOKEN",
  "CONTRACT_CALL",
  "UPDATE_ACCOUNT",
  "PRE_APPROVAL",
  "TRANSFER_PROPOSAL",
  "TRANSFER_REJECTED",
  "TRANSFER_WITHDRAWN",
]);

/** Flat operation: no subOperations/internalOperations/nftOperations (no recursion). value/fee serializable as string. */
export const OperationSchema = z.object({
  id: z.string(),
  hash: z.string(),
  type: OperationTypeSchema,
  value: z.string(), // serializable; parse to BigNumber when needed
  fee: z.string(), // serializable; parse to BigNumber when needed
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  blockHeight: z.number().nullable().optional(),
  blockHash: z.string().nullable().optional(),
  transactionSequenceNumber: z.string().optional(),
  accountId: z.string(),
  standard: z.string().optional(),
  operator: z.string().optional(),
  contract: z.string().optional(),
  tokenId: z.string().optional(),
  date: z.number(), // timestamp ms; restore with new Date() when needed
  hasFailed: z.boolean().optional(),
  transactionRaw: z.unknown().optional(),
  extra: z.unknown(),
});

export type StoredOperation = z.infer<typeof OperationSchema>;

/** Confirmed operations only; pendingOperations live in transactional slice. */
export const OperationHistoryEntrySchema = z.object({
  operations: z.array(OperationSchema),
  /** When set, the API has more pages; use this token in loadOperationHistory(..., { pagingToken }) to append. */
  nextPagingToken: z.string().optional(),
});

export const OperationHistoryStateSchema = z.object({
  byAccountId: z.record(OperationHistoryEntrySchema),
});

export type OperationHistoryEntry = z.infer<typeof OperationHistoryEntrySchema>;
export type OperationHistoryState = z.infer<typeof OperationHistoryStateSchema>;

/** Options for progressive pagination (Alpaca may support; bridge ignores). */
export interface LoadOperationsOptions {
  limit?: number;
  pagingToken?: string;
}

/** Result of a paginated load: when hasMore is true, next load should use nextPagingToken. */
export interface LoadOperationsResult {
  nextPagingToken?: string;
  hasMore: boolean;
}
