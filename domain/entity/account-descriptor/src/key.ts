import { v5 as uuidv5 } from "uuid";
import type { AccountDescriptor } from "./schema";
import { canonicalPath } from "./path";
import { formatDescriptorFields } from "./serialization.internals";
import { AccountUUIDSchema, type AccountUUID } from "./accountUUID";

/** Build-time namespace of AccountUUID. Not a secret; changing it changes every AccountUUID. */
const ACCOUNT_UUID_NAMESPACE = "b4a1d3a8-6c0e-4f0e-9a52-7d1f3c5e8a21";

/** A public key in hex: at least 32 bytes, so that no base58 or bech32 key matches. */
const HEX_PUBLIC_KEY = /^([0-9a-f]{2}){32,}$/i;

const isCaseInsensitive = (key: string) => key.startsWith("0x") || HEX_PUBLIC_KEY.test(key);

/** Canonical key and identity of an account: network case, hardened marker and hex key case collapse to one key. */
export function accountDescriptorKey(descriptor: AccountDescriptor): string {
  const { key } = descriptor;
  return formatDescriptorFields({
    ...descriptor,
    network: descriptor.network.toLowerCase(),
    key: descriptor.type === "address" && isCaseInsensitive(key) ? key.toLowerCase() : key,
    path: canonicalPath(descriptor.path),
  });
}

export function computeAccountUUID(descriptor: AccountDescriptor): AccountUUID {
  return AccountUUIDSchema.parse(uuidv5(accountDescriptorKey(descriptor), ACCOUNT_UUID_NAMESPACE));
}
