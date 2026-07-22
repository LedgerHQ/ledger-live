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

  try {
    if (isValidAddress(address, "zcash" as Currency)) return true;
  } catch {
    // fall through to shielded classification
  }

  const cls = classifyZcashRecipient(address);
  return !("error" in cls);
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
