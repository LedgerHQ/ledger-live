import { z } from "zod";
import { BigNumberStrSchema } from "@shared/schema-primitives";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

/** The account's native coin, or one of its tokens. Compared as a string: the two id brands share one schema. */
export const BalanceAssetIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

/** A non-negative integer, in the asset's smallest unit. */
export const AmountStrSchema = BigNumberStrSchema.refine(value => /^\d+$/.test(value), {
  message: "Expected a non-negative integer amount in the asset's smallest unit",
});

/** What one asset of an account amounts to, in crypto only. */
export const AccountAssetBalanceSchema = z.object({
  assetId: BalanceAssetIdSchema,
  balance: AmountStrSchema,
  spendableBalance: AmountStrSchema,
});

export type BalanceAssetId = z.infer<typeof BalanceAssetIdSchema>;
export type AccountAssetBalance = z.infer<typeof AccountAssetBalanceSchema>;

export const AccountBalancesStateSchema = z.partialRecord(
  AccountUUIDSchema,
  z.array(AccountAssetBalanceSchema),
);

export type AccountBalancesState = z.infer<typeof AccountBalancesStateSchema>;

export const initialAccountBalancesState: AccountBalancesState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    /** One row per asset. The source puts the account's native coin first. */
    balance: { query: undefined; result: AccountAssetBalance[] };
  }
}
