import { z } from "zod";
import { BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import {
  AccountIdSchema,
  AnyAccountIdSchema,
  type AccountId,
  type AnyAccountId,
} from "@domain/entity-account";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

export const BalanceAssetIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

export const AmountStrSchema = BigNumberStrSchema.refine(value => /^\d+$/.test(value), {
  message: "Expected a non-negative integer amount in the asset's smallest unit",
});

export const AccountBalanceSchema = z.object({
  accountId: AnyAccountIdSchema,
  assetId: BalanceAssetIdSchema,
  balance: AmountStrSchema,
  spendableBalance: AmountStrSchema,
  parentId: AccountIdSchema.optional(),
  at: DateTimeIsoSchema,
});

export const AccountBalanceRowsSchema = z.record(AnyAccountIdSchema, AccountBalanceSchema);

export type BalanceAssetId = z.infer<typeof BalanceAssetIdSchema>;
export type AccountBalance = z.infer<typeof AccountBalanceSchema>;

export type AccountBalanceRows = Record<AnyAccountId, AccountBalance>;

export type AccountBalanceStatus = {
  pending: boolean;
  error?: string;
  sourceId?: string;
};

export const IDLE_ACCOUNT_BALANCE_STATUS: AccountBalanceStatus = { pending: false };

export type AccountBalancesState = {
  rows: AccountBalanceRows;
  status: Record<AccountId, AccountBalanceStatus>;
};

export type WithAccountBalances = { accountBalances: AccountBalancesState };

export const initialAccountBalancesState: AccountBalancesState = { rows: {}, status: {} };
