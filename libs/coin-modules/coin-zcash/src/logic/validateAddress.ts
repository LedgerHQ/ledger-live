import { isValidAddress } from "@ledgerhq/wallet-btc/utils";
import type { Currency } from "@ledgerhq/wallet-btc/index";
import { classifyZcashRecipient } from "./address";

/**
 * Validates a Zcash recipient address: a valid transparent address (t1/t3,
 * checked via wallet-btc's Base58Check validator) OR a valid ZIP-316 Unified
 * Address carrying an Orchard receiver (checked via classifyZcashRecipient).
 * Sapling-only and malformed addresses are rejected.
 */
export function isValidZcashAddress(address: string): boolean {
  if (!address) return false;

  // A transparent address is settled by the Base58Check verdict, which verifies
  // the checksum. Falling through to the classifier instead would accept a
  // mistyped t-address: it reads the ZIP-316 prefix, not the checksum.
  if (address.startsWith("t")) return isTransparentZcashAddress(address);

  const cls = classifyZcashRecipient(address);
  return !("error" in cls);
}

/**
 * Whether the address is a transparent one (t1/t3). Distinct from
 * {@link isValidZcashAddress}, which also accepts Orchard-capable unified
 * addresses: the headless, address-indexed reads (balance, history) can only
 * answer for transparent addresses, since shielded value needs a viewing key.
 */
export function isTransparentZcashAddress(address: string): boolean {
  if (!address) return false;

  try {
    return isValidAddress(address, "zcash" as Currency);
  } catch {
    return false;
  }
}

/**
 * CoinModuleApi-level validateAddress (see api/index.ts). `parameters` is
 * part of the framework contract (currencyId/networkId) but Zcash address
 * validity does not depend on it.
 */
export async function validateAddress(
  address: string,
  _parameters?: Partial<{ currencyId: string; networkId: number }>,
): Promise<boolean> {
  return isValidZcashAddress(address);
}
