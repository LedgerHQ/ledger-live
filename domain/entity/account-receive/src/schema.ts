import { z } from "zod";
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

/** Where the account receives, any of its assets, and how the device confirms it. */
export const AccountReceiveSchema = ReceiveAddressSchema.extend({
  /** A second address, whose received funds stay private: the device derives it with its shielded derivation. */
  shielded: ReceiveAddressSchema.optional(),
});

export type AccountReceive = z.infer<typeof AccountReceiveSchema>;

/** The receive of an account, and the `revision` of the answer it comes from. */
export const AccountReceiveEntrySchema = z.object({
  revision: z.number(),
  receive: AccountReceiveSchema,
});

export type AccountReceiveEntry = z.infer<typeof AccountReceiveEntrySchema>;

export const AccountReceivesStateSchema = z.partialRecord(
  AccountUUIDSchema,
  AccountReceiveEntrySchema,
);

export type AccountReceivesState = z.infer<typeof AccountReceivesStateSchema>;

export const initialAccountReceivesState: AccountReceivesState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    receive: { query: undefined; result: AccountReceive };
  }
}
