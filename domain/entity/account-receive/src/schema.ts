import { z } from "zod";
import {
  CryptoOrTokenCurrencyIdSchema,
  type CryptoOrTokenCurrencyId,
} from "@domain/entity-currency";
import {
  AccountUUIDSchema,
  AddressSchema,
  DerivationPathSchema,
} from "@domain/entity-account-descriptor";

/** What the device confirms at `path` for an address to be trusted. */
export const ReceiveVerificationSchema = z.discriminatedUnion("type", [
  /** The device derives and shows this address, not always the one received on. */
  z.object({ type: z.literal("address"), path: DerivationPathSchema, address: AddressSchema }),
  /** The device is given this address and confirms its key owns it: it cannot derive it. */
  z.object({
    type: z.literal("addressConfirmation"),
    path: DerivationPathSchema,
    address: AddressSchema,
  }),
  /** The device only knows a key, which controls the account. */
  z.object({
    type: z.literal("publicKey"),
    path: DerivationPathSchema,
    publicKey: z.string().min(1),
  }),
]);

export type ReceiveVerification = z.infer<typeof ReceiveVerificationSchema>;

/** An address to receive on, and how the device confirms it, absent where it cannot. */
export const ReceiveAddressSchema = z.object({
  address: AddressSchema,
  verification: ReceiveVerificationSchema.optional(),
});

export type ReceiveAddress = z.infer<typeof ReceiveAddressSchema>;

/** Whether the account can receive, and on which address. */
export const AccountReceiveSchema = z.discriminatedUnion("status", [
  ReceiveAddressSchema.extend({
    status: z.literal("ready"),
    /** A second address, whose received funds stay private: the device derives it with its shielded derivation. */
    shielded: ReceiveAddressSchema.optional(),
  }),
  /** Known, but cannot receive before its onboarding on the network, whatever the asset. */
  z.object({ status: z.literal("onboardingRequired") }),
  /** Ready, but not for this token: the account must first activate it (association, opt-in, trustline). */
  z.object({ status: z.literal("assetActivationRequired") }),
]);

export type AccountReceive = z.infer<typeof AccountReceiveSchema>;

/** The asset to receive: the account's native coin when absent. */
export type AccountReceiveQuery = { assetId?: CryptoOrTokenCurrencyId };

/** The receive of one asset, which the slice keys it by. */
export const AccountAssetReceiveSchema = z.object({
  assetId: CryptoOrTokenCurrencyIdSchema,
  receive: AccountReceiveSchema,
});

export type AccountAssetReceive = z.infer<typeof AccountAssetReceiveSchema>;

/** The receive of one asset, and the `revision` of the answer it comes from. */
export const AccountReceiveEntrySchema = z.object({
  revision: z.number(),
  receive: AccountReceiveSchema,
});

export type AccountReceiveEntry = z.infer<typeof AccountReceiveEntrySchema>;

export const AccountReceivesStateSchema = z.partialRecord(
  AccountUUIDSchema,
  z.partialRecord(CryptoOrTokenCurrencyIdSchema, AccountReceiveEntrySchema),
);

export type AccountReceivesState = z.infer<typeof AccountReceivesStateSchema>;

export const initialAccountReceivesState: AccountReceivesState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    /** The result names its asset, which the slice keys the receive by. */
    receive: { query: AccountReceiveQuery | undefined; result: AccountAssetReceive };
  }
}
