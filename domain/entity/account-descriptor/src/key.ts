import { canonicalPath } from "@domain/entity-derivation";
import type { AccountDescriptor } from "./schema";
import { formatDescriptorFields } from "./serialization.internals";

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
