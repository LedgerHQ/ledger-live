import { z } from "zod";
import {
  AccountUUIDSchema,
  AddressSchema,
  DerivationPathSchema,
} from "@domain/entity-account-descriptor";

const addressVerification = <T extends string>(type: T) =>
  z.object({ type: z.literal(type), path: DerivationPathSchema, address: AddressSchema });

/** What the device confirms at `path` for an address to be trusted. */
export const ReceiveVerificationSchema = z.discriminatedUnion("type", [
  /** The device derives and shows this address, not always the one received on. */
  addressVerification("address"),
  /** The device is given this address and confirms its key owns it: it cannot derive it. */
  addressVerification("addressConfirmation"),
  /** The device derives and shows this shielded address with its shielded derivation, not `getAddress`. */
  addressVerification("shieldedAddress"),
  /** The device only knows a key, which controls the account. */
  z.object({
    type: z.literal("publicKey"),
    path: DerivationPathSchema,
    publicKey: z.string().min(1),
  }),
]);

export type ReceiveVerification = z.infer<typeof ReceiveVerificationSchema>;

/**
 * The memo or tag a sender can attach next to the address, as the coin's send contract declares
 * it: exchanges and custodians receive on shared addresses and tell their users apart by it.
 */
export const ReceiveMemoSchema = z.discriminatedUnion("type", [
  /** Free text, up to `maxLength` characters. */
  z.object({ type: z.literal("text"), maxLength: z.number().int().positive().optional() }),
  /** A number (XRP destination tag), up to `maxValue`, in decimal: it can exceed 2^53. */
  z.object({ type: z.literal("tag"), maxValue: z.string().regex(/^\d+$/).optional() }),
  /** One of several kinds (Stellar), `defaultOption` preselected. */
  z.object({
    type: z.literal("typed"),
    options: z.array(z.string().min(1)).nonempty(),
    defaultOption: z.string().min(1).optional(),
  }),
]);

export type ReceiveMemo = z.infer<typeof ReceiveMemoSchema>;

/** An address to receive on, and how the device confirms it, absent where it cannot. */
export const ReceiveAddressSchema = z.object({
  address: AddressSchema,
  verification: ReceiveVerificationSchema.optional(),
  memo: ReceiveMemoSchema.optional(),
});

export type ReceiveAddress = z.infer<typeof ReceiveAddressSchema>;

/** Where the account receives, any of its assets, and how the device confirms it. */
export const AccountReceiveSchema = ReceiveAddressSchema.extend({
  /** A second address whose received funds stay private (Zcash). */
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
