import { z } from "zod";
import {
  AccountIdSchema,
  BigNumberStrSchema,
  DateTimeIsoSchema,
  type AccountId,
} from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

/**
 * The asset a balance is denominated in: a crypto currency for a main account, a token currency for
 * a token account. Stored as an id rather than a resolved currency object so the table stays
 * serializable and persistable as-is.
 */
export const BalanceAssetIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

/**
 * An amount in the asset's smallest unit.
 *
 * Stricter than `BigNumberStrSchema`, which admits `-1` and `1.5`: a balance has no sign and no
 * fraction — the smallest unit *is* the unit — and every consumer does `BigInt` arithmetic on it,
 * which throws on a fractional string. Refined rather than re-branded so the value stays a
 * `BigNumberStr` for callers.
 */
export const AmountStrSchema = BigNumberStrSchema.refine(value => /^\d+$/.test(value), {
  message: "Expected a non-negative integer amount in the asset's smallest unit",
});

/**
 * One account's balance, at one point in time.
 *
 * `balance` and `spendableBalance` are decimal strings in the asset's smallest unit — never
 * `BigNumber`, so the whole table can go through Redux and to disk untouched. Callers parse with
 * their own BigNumber implementation at the edge.
 */
export const AccountBalanceSchema = z.object({
  accountId: AccountIdSchema,
  assetId: BalanceAssetIdSchema,
  /** Total holdings, including whatever is locked, reserved or staked. */
  balance: AmountStrSchema,
  /** The part of `balance` that can be spent right now (total minus locked / reserved). */
  spendableBalance: AmountStrSchema,
  /** Set when this row is a token account; absent on a main account. */
  parentId: AccountIdSchema.optional(),
  /** When the source produced this balance — the freshness the UI can show. */
  at: DateTimeIsoSchema,
});

/**
 * Balance rows keyed by account id — main accounts and token accounts in the same flat table.
 *
 * The key is validated too, not only the row: this schema is what a persisted (so untrusted) table
 * is read back through, and a blank key would sail through `z.string()` only to fail every lookup.
 */
export const AccountBalancesStateSchema = z.record(AccountIdSchema, AccountBalanceSchema);

export type BalanceAssetId = z.infer<typeof BalanceAssetIdSchema>;
export type AccountBalance = z.infer<typeof AccountBalanceSchema>;

/**
 * Declared by hand rather than inferred: the table's contract — only an {@link AccountId} may index
 * it — is what every consumer types against, and it must hold whether or not the schema is in play.
 */
export type AccountBalancesState = Record<AccountId, AccountBalance>;

/** Redux state contract: apps must mount {@link accountBalancesSlice} under this exact key. */
export type WithAccountBalances = { accountBalances: AccountBalancesState };

export const initialAccountBalancesState: AccountBalancesState = {};
