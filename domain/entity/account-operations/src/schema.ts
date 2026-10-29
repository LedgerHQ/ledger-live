import { z } from "zod";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import {
  AmountStrSchema,
  BalanceAssetIdSchema,
  type BalanceAssetId,
} from "@domain/entity-account-balance";

export const OperationIdSchema = z.string().min(1).brand<"OperationId">();
export const TransactionHashSchema = z.string().min(1).brand<"TransactionHash">();
/** A sender or recipient: branded so analytics can refuse it. */
export const AddressSchema = z.string().min(1).brand<"Address">();

/** Mirrors the operation types of `@ledgerhq/types-live`, for backward compatibility. */
export const OPERATION_TYPES = [
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
  "FINALIZE_UNSTAKE",
  "BURN",
  "ASSOCIATE_TOKEN",
  "CONTRACT_CALL",
  "UPDATE_ACCOUNT",
  "PRE_APPROVAL",
  "TRANSFER_PROPOSAL",
  "TRANSFER_REJECTED",
  "TRANSFER_WITHDRAWN",
  "SHIELDED_TX_SAPLING_IN",
  "SHIELDED_TX_SAPLING_OUT",
  "SHIELDED_TX_ORCHARD_IN",
  "SHIELDED_TX_ORCHARD_OUT",
  "SHIELDED_TX_IRONWOOD_IN",
  "SHIELDED_TX_IRONWOOD_OUT",
  "SHIELDED_TX_INTERNAL",
  "STAKE_NEURON",
  "TOP_UP_NEURON",
] as const;

export const OperationTypeSchema = z.enum(OPERATION_TYPES);

/** One operation of an account. A token, sub or internal operation is its own row, pointing at its parent. */
export const AccountOperationSchema = z.object({
  id: OperationIdSchema,
  hash: TransactionHashSchema,
  type: OperationTypeSchema,
  /** The asset `value` and `fee` are expressed in. */
  assetId: BalanceAssetIdSchema,
  value: AmountStrSchema,
  fee: AmountStrSchema,
  senders: z.array(AddressSchema),
  recipients: z.array(AddressSchema),
  /** `null` while the operation is pending. */
  blockHeight: z.number().int().nonnegative().nullable(),
  date: DateTimeIsoSchema,
  hasFailed: z.boolean().optional(),
  parentId: OperationIdSchema.optional(),
});

export type OperationId = z.infer<typeof OperationIdSchema>;
export type TransactionHash = z.infer<typeof TransactionHashSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type OperationType = z.infer<typeof OperationTypeSchema>;
export type AccountOperation = z.infer<typeof AccountOperationSchema>;

/** What a read asks for; the cursor is not part of it, the framework carries it. */
export type AccountOperationsQuery = {
  limit?: number;
  /** Only the operations in this asset: a screen about one asset. */
  filterAsset?: BalanceAssetId;
};

export type AccountOperationsPage = {
  operations: AccountOperation[];
  /** Absent at the end of the list. */
  nextCursor?: string;
};

/** The loaded window of each account, newest first. */
export const AccountOperationsStateSchema = z.partialRecord(
  AccountUUIDSchema,
  z.array(AccountOperationSchema),
);

export type AccountOperationsState = z.infer<typeof AccountOperationsStateSchema>;

export const initialAccountOperationsState: AccountOperationsState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    /** Newest first, pending first; token operations are rows of their own. */
    operations: { query: AccountOperationsQuery | undefined; result: AccountOperationsPage };
  }
}
