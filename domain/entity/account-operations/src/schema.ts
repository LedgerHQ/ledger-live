import { z } from "zod";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { AnyAccountIdSchema, type AccountId } from "@domain/entity-account";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

export const OperationAssetIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

export const OperationAmountSchema = BigNumberStrSchema.refine(value => /^\d+$/.test(value), {
  message: "Expected a non-negative integer amount in the asset's smallest unit",
});

export const AccountOperationSchema = z.object({
  id: z.string().min(1),
  accountId: AnyAccountIdSchema,
  assetId: OperationAssetIdSchema,
  hash: z.string().min(1),
  type: z.string().min(1),
  value: OperationAmountSchema,
  fee: OperationAmountSchema,
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  blockHeight: z.number().int().nonnegative().nullable(),
  date: DateTimeIsoSchema,
  hasFailed: z.boolean().optional(),
  parentOperationId: z.string().min(1).optional(),
});

export type AccountOperation = z.infer<typeof AccountOperationSchema>;

export type AccountOperationsEntry = {
  operations: AccountOperation[];
  nextCursor?: string;
  complete: boolean;
  at?: string;
  total?: number;
};

export type AccountOperationsStatus = {
  pending: boolean;
  error?: string;
  sourceId?: string;
};

export const IDLE_ACCOUNT_OPERATIONS_STATUS: AccountOperationsStatus = { pending: false };
export const EMPTY_ACCOUNT_OPERATIONS_ENTRY: AccountOperationsEntry = {
  operations: [],
  complete: false,
};

export type AccountOperationsState = {
  byAccount: Record<AccountId, AccountOperationsEntry>;
  status: Record<AccountId, AccountOperationsStatus>;
};

export type WithAccountOperations = { accountOperations: AccountOperationsState };

export const initialAccountOperationsState: AccountOperationsState = { byAccount: {}, status: {} };
