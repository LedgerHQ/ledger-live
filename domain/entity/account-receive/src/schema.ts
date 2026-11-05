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

/** Whether the account can receive, and on which address. */
export const AccountReceiveSchema = z.discriminatedUnion("status", [
  ReceiveAddressSchema.extend({
    status: z.literal("ready"),
    /** A second address, whose received funds stay private: the device derives it with its shielded derivation. */
    shielded: ReceiveAddressSchema.optional(),
  }),
  /** Known, but cannot receive before its onboarding on the network. */
  z.object({ status: z.literal("onboardingRequired") }),
]);

export type AccountReceive = z.infer<typeof AccountReceiveSchema>;

export const AccountReceivesStateSchema = z.partialRecord(AccountUUIDSchema, AccountReceiveSchema);

export type AccountReceivesState = z.infer<typeof AccountReceivesStateSchema>;

export const initialAccountReceivesState: AccountReceivesState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    receive: { query: undefined; result: AccountReceive };
  }
}
