import { z } from "zod";
import { NetworkSchema } from "./network";
import { canonicalPath } from "./path";

/** BIP32 indices are below 2^31, without leading zeros so that one path has one spelling. */
const withinBip32Range = (path: string) =>
  path
    .split("/")
    .slice(1)
    .every(segment => Number.parseInt(segment, 10) < 2 ** 31);

export const UtxoAccountDescriptorSchema = z.object({
  purpose: z.literal("account"),
  version: z.literal("1"),
  type: z.literal("utxo"),
  network: NetworkSchema,
  xpub: z
    .string()
    .min(1)
    .regex(/^\S+$/, "xpub field must not contain whitespace")
    .refine(v => !/^[xyztuv]prv/i.test(v), {
      message: "xpub field must not contain a private extended key (xprv/yprv/zprv/tprv/uprv/vprv)",
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
  purpose: z.literal("account"),
  version: z.literal("1"),
  type: z.literal("address"),
  network: NetworkSchema,
  address: z.string().min(1),
  /** Full derivation path, e.g. "m/44h/60h/0h/0/0"; "'" and "H" are read as "h". */
  path: z
    .string()
    .regex(/^m(\/(0|[1-9]\d*)[hH']?)+$/, "Path must look like m/44h/60h/0h/0/0")
    .transform(canonicalPath)
    .refine(withinBip32Range, { message: "Path index must be below 2^31" }),
});

export const AccountDescriptorSchema = z.discriminatedUnion("type", [
  UtxoAccountDescriptorSchema,
  AddressAccountDescriptorSchema,
]);

export type UtxoAccountDescriptor = z.infer<typeof UtxoAccountDescriptorSchema>;
export type AddressAccountDescriptor = z.infer<typeof AddressAccountDescriptorSchema>;
export type AccountDescriptor = z.infer<typeof AccountDescriptorSchema>;
