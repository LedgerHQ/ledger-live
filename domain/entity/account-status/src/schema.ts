import { z } from "zod";
import {
  CryptoOrTokenCurrencyIdSchema,
  type CryptoOrTokenCurrencyId,
} from "@domain/entity-currency";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";

/** An on-chain step the account must take before it transacts, whatever the asset. */
export const AccountGateSchema = z.discriminatedUnion("type", [
  /** Not registered on the network yet (Canton party, Concordium credential): it can neither receive nor send. */
  z.object({ type: z.literal("onboarding") }),
  /** It receives, but a chain precondition is unmet before it sends (Tezos `unrevealed`, Sei `activationRequired`). */
  z.object({ type: z.literal("activation"), reason: z.string().min(1).nullable() }),
]);

export type AccountGate = z.infer<typeof AccountGateSchema>;

/** Whether the account was ever used, and what it must do first to transact, whatever the asset. */
export const AccountStatusSchema = z.object({
  /** Ever used: it has a transaction, or a balance of any asset, as the legacy scan's `Account.used`. */
  exists: z.boolean(),
  accountGate: AccountGateSchema.nullable(),
});

export type AccountStatus = z.infer<typeof AccountStatusSchema>;

/** How a token is activated on its network: XRP MPTs are `authorize`d, its IOUs need a `trustline`. */
export const AssetActivationMethodSchema = z.enum([
  "association",
  "optIn",
  "trustline",
  "authorize",
]);

export type AssetActivationMethod = z.infer<typeof AssetActivationMethodSchema>;

/** What the account must do before it holds the asset (Hedera, Algorand, Stellar, XRP). */
export const AssetGateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("activation"), method: AssetActivationMethodSchema }),
  /** The data at hand cannot tell whether the token is activated (an XRP standard sync does not read). */
  z.object({ type: z.literal("unknown") }),
]);

export type AssetGate = z.infer<typeof AssetGateSchema>;

/** Whether the account can hold one asset. */
export const AssetStatusSchema = z.object({
  /** Null only when there is no gate: always for the native coin. */
  assetGate: AssetGateSchema.nullable(),
});

export type AssetStatus = z.infer<typeof AssetStatusSchema>;

/** The asset to read: a token of the account's network or its native coin. */
export type AssetStatusQuery = { assetId: CryptoOrTokenCurrencyId };

/** The status of one asset, which the slice keys it by. */
export const AccountAssetStatusSchema = z.object({
  assetId: CryptoOrTokenCurrencyIdSchema,
  status: AssetStatusSchema,
});

export type AccountAssetStatus = z.infer<typeof AccountAssetStatusSchema>;

export const AccountStatusEntrySchema = z.object({
  revision: z.number(),
  status: AccountStatusSchema,
});

export type AccountStatusEntry = z.infer<typeof AccountStatusEntrySchema>;

export const AssetStatusEntrySchema = z.object({
  revision: z.number(),
  status: AssetStatusSchema,
});

export type AssetStatusEntry = z.infer<typeof AssetStatusEntrySchema>;

/** Each answer with the `revision` it comes from: the account read, then one entry per asset read. */
export const AccountStatusesSchema = z.object({
  account: AccountStatusEntrySchema.optional(),
  assets: z.partialRecord(CryptoOrTokenCurrencyIdSchema, AssetStatusEntrySchema),
});

export type AccountStatuses = z.infer<typeof AccountStatusesSchema>;

export const AccountStatusStateSchema = z.partialRecord(AccountUUIDSchema, AccountStatusesSchema);

export type AccountStatusState = z.infer<typeof AccountStatusStateSchema>;

export const initialAccountStatusState: AccountStatusState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    accountStatus: { query: undefined; result: AccountStatus };
    /** The result names its asset, which the slice keys the status by. */
    assetStatus: { query: AssetStatusQuery; result: AccountAssetStatus };
  }
}
