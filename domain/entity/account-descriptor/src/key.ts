import { v5 as uuidv5 } from "uuid";
import { z } from "zod";
import type { AccountDescriptor } from "./schema";
import { canonicalPath } from "./path";
import { serializeAccountDescriptor } from "./serialization";

/** Build-time namespace of AccountUUID. Not a secret; changing it changes every AccountUUID. */
const ACCOUNT_UUID_NAMESPACE = "b4a1d3a8-6c0e-4f0e-9a52-7d1f3c5e8a21";

export const AccountUUIDSchema = z.uuid({ version: "v5" }).brand<"AccountUUID">();

/** Deterministic identity of an account, the same on every device; carries neither xpub nor address. */
export type AccountUUID = z.infer<typeof AccountUUIDSchema>;

/** Canonical key and identity of an account: hardened marker and `0x` address case collapse to one key. */
export function accountDescriptorKey(descriptor: AccountDescriptor): string {
  const normalized: AccountDescriptor = { ...descriptor, path: canonicalPath(descriptor.path) };
  if (normalized.type === "address" && normalized.address.startsWith("0x")) {
    normalized.address = normalized.address.toLowerCase();
  }
  return serializeAccountDescriptor(normalized);
}

export function computeAccountUUID(descriptor: AccountDescriptor): AccountUUID {
  return AccountUUIDSchema.parse(uuidv5(accountDescriptorKey(descriptor), ACCOUNT_UUID_NAMESPACE));
}
