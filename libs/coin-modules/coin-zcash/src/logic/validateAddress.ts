import { isValidAddress } from "@ledgerhq/wallet-btc/utils";
import type { Currency } from "@ledgerhq/wallet-btc/index";
import { classifyZcashRecipient } from "./address";
import { zcashNetworkOf } from "./network";

/**
 * Validates a Zcash recipient address for the network of `currencyId`: a valid
 * transparent address (t1/t3, or tm/t2 on testnet, checked via wallet-btc's
 * Base58Check validator) OR a valid ZIP-316 Unified Address carrying an Orchard
 * receiver or, without one, a transparent receiver (checked via
 * classifyZcashRecipient). Sapling-only, malformed and other-network addresses
 * are rejected.
 */
export function isValidZcashAddress(address: string, currencyId: string = "zcash"): boolean {
  if (!address) return false;

  // A transparent address is settled by the Base58Check verdict, which verifies
  // the checksum. Falling through to the classifier instead would accept a
  // mistyped t-address: it reads the ZIP-316 prefix, not the checksum.
  if (address.startsWith("t")) return isTransparentZcashAddress(address, currencyId);

  const cls = classifyZcashRecipient(address, zcashNetworkOf(currencyId));
  return !("error" in cls);
}

/**
 * The Base58Check verdict on a transparent address, which is what makes a
 * mistyped one fail: `wallet-btc` verifies the checksum and the version bytes
 * of the currency, so this agrees with how coin-bitcoin validates the same
 * address.
 */
function isTransparentZcashAddress(address: string, currencyId: string): boolean {
  if (!address) return false;

  try {
    return isValidAddress(address, currencyId as Currency);
  } catch {
    return false;
  }
}

/**
 * The `CurrencyBridge` entry point (see bridge/index.ts). The network comes
 * from `parameters.currencyId`, mainnet when absent.
 */
export async function validateAddress(
  address: string,
  parameters?: Partial<{ currencyId: string; networkId: number }>,
): Promise<boolean> {
  return isValidZcashAddress(address, parameters?.currencyId ?? "zcash");
}
