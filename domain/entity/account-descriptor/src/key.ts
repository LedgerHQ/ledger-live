import { v5 as uuidv5 } from "uuid";
import { z } from "zod";
import type { AccountDescriptor } from "./schema";
import { serializeAccountDescriptor } from "./serialization";

/** Build-time namespace of AccountUUID. Not a secret; changing it changes every AccountUUID. */
const ACCOUNT_UUID_NAMESPACE = "b4a1d3a8-6c0e-4f0e-9a52-7d1f3c5e8a21";

export const AccountUUIDSchema = z.uuid({ version: "v5" }).brand<"AccountUUID">();

/** Deterministic identity of an account, the same on every device; carries neither xpub nor address. */
export type AccountUUID = z.infer<typeof AccountUUIDSchema>;

/** Canonical key and identity of an account: `0x` address case (checksummed or lowercase) collapses to one key. */
export function accountDescriptorKey(descriptor: AccountDescriptor): string {
  if (descriptor.type === "address" && descriptor.address.startsWith("0x")) {
    return serializeAccountDescriptor({ ...descriptor, address: descriptor.address.toLowerCase() });
  }
  return serializeAccountDescriptor(descriptor);
}

export function computeAccountUUID(descriptor: AccountDescriptor): AccountUUID {
  return AccountUUIDSchema.parse(uuidv5(accountDescriptorKey(descriptor), ACCOUNT_UUID_NAMESPACE));
}
