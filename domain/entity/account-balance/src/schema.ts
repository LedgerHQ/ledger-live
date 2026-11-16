import { z } from "zod";
import { BigNumberStrSchema } from "@shared/schema-primitives";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";

/** A non-negative integer, in the asset's smallest unit. */
export const AmountStrSchema = BigNumberStrSchema.refine(value => /^\d+$/.test(value), {
  message: "Expected a non-negative integer amount in the asset's smallest unit",
});

/** Why part of a balance cannot be spent. */
export const BalanceLockReasonSchema = z.enum([
  /** Kept by the network: minimum balance, rent, deposit, fee reserve. */
  "reserve",
  "staked",
  /** On its way back from staking, spendable once the period ends. */
  "unbonding",
  /** Frozen for network resources (Tron energy and bandwidth). */
  "frozen",
  "pending",
  "other",
]);

export type BalanceLockReason = z.infer<typeof BalanceLockReasonSchema>;

/** One non-spendable part of a balance. */
export const BalanceLockSchema = z.object({
  reason: BalanceLockReasonSchema,
  amount: AmountStrSchema,
});

export type BalanceLock = z.infer<typeof BalanceLockSchema>;

/** What one asset of an account amounts to, in crypto only. */
export const AccountAssetBalanceSchema = z.object({
  /** The account's native coin, or one of its tokens. */
  assetId: CryptoOrTokenCurrencyIdSchema,
  balance: AmountStrSchema,
  spendableBalance: AmountStrSchema,
  /** Why part of the balance is not spendable, when the source knows; absent when it does not tell. */
  locked: z.array(BalanceLockSchema).optional(),
});

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
