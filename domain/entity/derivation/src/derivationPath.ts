import { z } from "zod";

/** `h`, `H` and `'` all mark a hardened segment (BIP-380); the canonical spelling is `h`. */
export const canonicalPath = (path: string) => path.replaceAll("'", "h").replaceAll("H", "h");

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
  .refine(withinBip32Range, { message: "Path index must be below 2^31" })
  .brand<"DerivationPath">();

export type DerivationPath = z.infer<typeof DerivationPathSchema>;
