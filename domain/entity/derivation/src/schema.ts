import { z } from "zod";
import { DerivationPathSchema, NetworkIdSchema } from "@domain/entity-account-descriptor";
import { DERIVATION_MODES, type DerivationMode } from "./modes";

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
  /** Account-level path, e.g. `m/84h/0h/2h`: where an extended public key is derived. */
  accountPath: DerivationPathSchema,
  /** Path of the account's first address, e.g. `m/44h/60h/0h/0/0`. */
  addressPath: DerivationPathSchema,
});

export type AccountCandidate = Readonly<z.infer<typeof AccountCandidateSchema>>;
