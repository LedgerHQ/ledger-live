import { z } from "zod";
import { AmountStrSchema } from "@domain/entity-account-balance";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  AccountOperationSchema,
  AddressSchema,
  TransactionHashSchema,
} from "@domain/entity-account-operation";

/** A fee preset id, `slow`, `medium`, `fast` or one a network names, or `custom` with `customFees`. */
export const FeeStrategySchema = z.string().min(1);

/** Some networks qualify a memo: Stellar's `MEMO_TEXT`, `MEMO_ID`… The source's default when absent. */
export const MemoSchema = z.object({
  value: z.string(),
  type: z.string().optional(),
});

/** What a send asks for, the same on every network: each source turns it into its own transaction. */
export const SendRequestSchema = z.object({
  /** The asset sent: the account's native coin or one of its tokens. */
  assetId: CryptoOrTokenCurrencyIdSchema,
  recipient: AddressSchema,
  /** The name the recipient was resolved from, an ENS domain for instance. */
  recipientDomain: z.string().optional(),
  /** In the asset's smallest unit; ignored with `useAllAmount`. */
  amount: AmountStrSchema,
  /** Everything the account can send, fees deducted. */
  useAllAmount: z.boolean().optional(),
  feeStrategy: FeeStrategySchema.optional(),
  /** With `feeStrategy: "custom"`, the values of the network's custom fee inputs (`maxFeePerGas`, `feePerByte`…) as its send descriptor takes them. */
  customFees: z.record(z.string(), z.string()).optional(),
  /** Pays the fees in another asset than the network's coin, when the source offers it (sponsored fees). */
  feeAssetId: CryptoOrTokenCurrencyIdSchema.optional(),
  /** A tag or memo the recipient needs, an exchange deposit for instance; a source that cannot carry it fails the preparation. */
  memo: MemoSchema.optional(),
  /** Network fields the request does not model yet (coin control, balance pool…), only read by the sources that know them. */
  familyOptions: z.record(z.string(), z.json()).optional(),
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
  feeAssetId: CryptoOrTokenCurrencyIdSchema,
  /** What leaves the account in the sent asset, fees included when paid in it. */
  totalSpent: AmountStrSchema,
  errors: z.array(TransactionIssueSchema),
  warnings: z.array(TransactionIssueSchema),
  payload: SourcePayloadSchema,
});

/** What a fee preset would cost for the same request, for a fee picker. */
export const FeeEstimateSchema = z.object({
  strategy: FeeStrategySchema,
  fees: AmountStrSchema,
  feeAssetId: CryptoOrTokenCurrencyIdSchema,
});

export const SignedTransactionSchema = z.object({ payload: SourcePayloadSchema });

/** The network took it: its hash, and the pending rows it is likely to add to the operations when the source can tell. */
export const BroadcastedTransactionSchema = z.object({
  hash: TransactionHashSchema,
  operations: z.array(AccountOperationSchema),
});

export type FeeStrategy = z.infer<typeof FeeStrategySchema>;
export type Memo = z.infer<typeof MemoSchema>;
export type SendRequest = z.infer<typeof SendRequestSchema>;
export type TransactionIssue = z.infer<typeof TransactionIssueSchema>;
export type PreparedTransaction = z.infer<typeof PreparedTransactionSchema>;
export type FeeEstimate = z.infer<typeof FeeEstimateSchema>;
export type SignedTransaction = z.infer<typeof SignedTransactionSchema>;
export type BroadcastedTransaction = z.infer<typeof BroadcastedTransactionSchema>;
