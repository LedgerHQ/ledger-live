import { z } from "zod";
import { DerivationPathSchema } from "@domain/entity-account-descriptor";

/** Account-level path, e.g. `m/84h/0h/2h`: a `DerivationPath`, the path of a utxo descriptor. */
export const AccountPathSchema = DerivationPathSchema.brand<"AccountPath">();
export type AccountPath = z.infer<typeof AccountPathSchema>;

/** Path of an account's first address, e.g. `m/44h/60h/0h/0/0`: a `DerivationPath`, the path of an address descriptor. */
export const AddressPathSchema = DerivationPathSchema.brand<"AddressPath">();
export type AddressPath = z.infer<typeof AddressPathSchema>;
