import { z } from "zod";
import { AmountStrSchema, BalanceAssetIdSchema } from "@domain/entity-account-balance";
import {
  AccountOperationSchema,
  AddressSchema,
  TransactionHashSchema,
} from "@domain/entity-account-operation";

export const FeeStrategySchema = z.enum(["slow", "medium", "fast"]);

/** What a send asks for, the same on every network: each source turns it into its own transaction. */
export const SendRequestSchema = z.object({
  /** The asset sent: the account's native coin or one of its tokens. */
  assetId: BalanceAssetIdSchema,
  recipient: AddressSchema,
  /** In the asset's smallest unit; ignored with `useAllAmount`. */
  amount: AmountStrSchema,
  /** Everything the account can send, fees deducted. */
  useAllAmount: z.boolean().optional(),
  feeStrategy: FeeStrategySchema.optional(),
  /** A tag or memo the recipient needs, an exchange deposit for instance; a source that cannot carry it fails the preparation. */
  memo: z.string().optional(),
});

/** Why a transaction cannot be sent as is, or what to warn about: an error name, its translation params, the request field it is about. */
export const TransactionIssueSchema = z.object({
  name: z.string(),
  message: z.string(),
  field: z.enum(["recipient", "amount", "fees", "memo"]).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

/** Opaque to all but the source that wrote it, and serializable so a flow can keep it. */
export const SourcePayloadSchema = z.json();

/** A transaction a source built for a request, signable once `errors` is empty; signing never changes what it shows. */
export const PreparedTransactionSchema = z.object({
  request: SendRequestSchema,
  /** What the recipient gets, in the asset's smallest unit. */
  amount: AmountStrSchema,
  /** In `feeAssetId`'s smallest unit. */
  fees: AmountStrSchema,
  feeAssetId: BalanceAssetIdSchema,
  /** What leaves the account in the sent asset, fees included when paid in it. */
  totalSpent: AmountStrSchema,
  errors: z.array(TransactionIssueSchema),
  warnings: z.array(TransactionIssueSchema),
  payload: SourcePayloadSchema,
});

export const SignedTransactionSchema = z.object({ payload: SourcePayloadSchema });

/** The network took it: its hash, and the pending rows it is likely to add to the operations when the source can tell. */
export const BroadcastedTransactionSchema = z.object({
  hash: TransactionHashSchema,
  operations: z.array(AccountOperationSchema),
});

export type FeeStrategy = z.infer<typeof FeeStrategySchema>;
export type SendRequest = z.infer<typeof SendRequestSchema>;
export type TransactionIssue = z.infer<typeof TransactionIssueSchema>;
export type PreparedTransaction = z.infer<typeof PreparedTransactionSchema>;
export type SignedTransaction = z.infer<typeof SignedTransactionSchema>;
export type BroadcastedTransaction = z.infer<typeof BroadcastedTransactionSchema>;
