import { z } from "zod";
import { NetworkIdSchema } from "./network";
import { canonicalPath } from "./path";

/** BIP32 indices are below 2^31, without leading zeros so that one path has one spelling. */
const withinBip32Range = (path: string) =>
  path
    .split("/")
    .slice(1)
    .every(segment => Number.parseInt(segment, 10) < 2 ** 31);

/** A full BIP32 path, e.g. "m/44h/60h/0h/0/0"; "'" and "H" are read as "h". */
export const DerivationPathSchema = z
  .string()
  .regex(/^m(\/(0|[1-9]\d*)[hH']?)+$/, "Path must look like m/44h/60h/0h/0/0")
  .transform(canonicalPath)
  .refine(withinBip32Range, { message: "Path index must be below 2^31" });

export type DerivationPath = z.infer<typeof DerivationPathSchema>;

/** `account` names a real account; `mock` a generated one, served by the mock source only. */
export const AccountPurposeSchema = z.enum(["account", "mock"]);

export type AccountPurpose = z.infer<typeof AccountPurposeSchema>;

/** The public value the account is found and read from on its network. */
const AccountKeySchema = z.string().min(1).regex(/^\S+$/, "key must not contain whitespace");

export const UtxoAccountDescriptorSchema = z.object({
  purpose: AccountPurposeSchema,
  version: z.literal("2"),
  type: z.literal("utxo"),
  network: NetworkIdSchema,
  /** The account's xpub, with the network's standard version bytes. */
  key: AccountKeySchema.refine(v => !/^[xyztuv]prv/i.test(v), {
    message: "key must not be a private extended key (xprv/yprv/zprv/tprv/uprv/vprv)",
  }),
  /** Hardened-only BIP32 path, e.g. "m/84h/0h/0h"; "'" and "H" are read as "h". */
  path: z
    .string()
    .regex(
      /^m(\/(0|[1-9]\d*)[hH'])+$/,
      "UTXO path must only contain hardened segments, e.g. m/84h/0h/0h",
    )
    .transform(canonicalPath)
    .refine(withinBip32Range, { message: "Path index must be below 2^31" }),
});

export const AddressAccountDescriptorSchema = z.object({
  purpose: AccountPurposeSchema,
  version: z.literal("2"),
  type: z.literal("address"),
  network: NetworkIdSchema,
  /** The account key on the network: an address, a public key or a network account id, by family. */
  key: AccountKeySchema,
  /** Full derivation path, e.g. "m/44h/60h/0h/0/0"; "'" and "H" are read as "h". */
  path: DerivationPathSchema,
});

export const AccountDescriptorSchema = z.discriminatedUnion("type", [
  UtxoAccountDescriptorSchema,
  AddressAccountDescriptorSchema,
]);

export type UtxoAccountDescriptor = z.infer<typeof UtxoAccountDescriptorSchema>;
export type AddressAccountDescriptor = z.infer<typeof AddressAccountDescriptorSchema>;
export type AccountDescriptor = z.infer<typeof AccountDescriptorSchema>;
