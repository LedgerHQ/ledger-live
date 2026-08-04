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
 * The Base58Check verdict on a transparent address (t1/t3), which is what makes
 * a mistyped one fail: `wallet-btc` verifies the checksum, so this agrees with
 * how coin-bitcoin validates the same address.
 */
function isTransparentZcashAddress(address: string): boolean {
  if (!address) return false;

  try {
    return isValidAddress(address, "zcash" as Currency);
  } catch {
    return false;
  }
}

/**
 * The `CurrencyBridge` entry point (see bridge/index.ts). `parameters` is part
 * of its contract (currencyId/networkId) but Zcash address validity does not
 * depend on it.
 */
export async function validateAddress(
  address: string,
  _parameters?: Partial<{ currencyId: string; networkId: number }>,
): Promise<boolean> {
  return isValidZcashAddress(address);
}
