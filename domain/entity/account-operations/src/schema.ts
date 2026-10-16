import { z } from "zod";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

export const OperationAssetIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

export const OperationAmountSchema = BigNumberStrSchema.refine(value => /^\d+$/.test(value), {
  message: "Expected a non-negative integer amount in the asset's smallest unit",
});

/** One operation on one asset of the account; a token transfer's fee is its parent operation's. */
export const AccountOperationSchema = z.object({
  id: z.string().min(1),
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

export type AccountOperationsQuery = { limit?: number };

/** One page, newest first; `nextCursor` reaches further back, absent at the oldest. */
export type AccountOperationsPage = {
  operations: AccountOperation[];
  nextCursor?: string;
  /** How many operations the account has in all, when the source knows. */
  total?: number;
};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    operations: { query: AccountOperationsQuery; result: AccountOperationsPage };
  }
}
