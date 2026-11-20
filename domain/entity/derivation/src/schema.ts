import { z } from "zod";
import { NetworkIdSchema } from "@domain/entity-account-descriptor";
import { DERIVATION_MODES } from "./modes.internals";
import { AccountPathSchema, AddressPathSchema } from "./paths";

/** A mode of `ledger-wallet-framework/derivation.ts`; "" is the BIP44 default. */
export type DerivationMode = keyof typeof DERIVATION_MODES;

const isDerivationMode = (value: unknown): value is DerivationMode =>
  typeof value === "string" && Object.hasOwn(DERIVATION_MODES, value);

export const DerivationModeSchema = z.custom<DerivationMode>(isDerivationMode, {
  message: "Unknown derivation mode",
});

/** Where to derive one account a scan may find; the device's answer makes it an `AccountDescriptor`. */
export const AccountCandidateSchema = z.object({
  network: NetworkIdSchema,
  derivationMode: DerivationModeSchema,
  index: z.number().int().nonnegative(),
  accountPath: AccountPathSchema,
  addressPath: AddressPathSchema,
});

export type AccountCandidate = Readonly<z.infer<typeof AccountCandidateSchema>>;
