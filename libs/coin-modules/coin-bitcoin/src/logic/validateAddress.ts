import { isValidAddress as walletIsValidAddress } from "@ledgerhq/wallet-btc/utils";
import type { Currency } from "@ledgerhq/wallet-btc/crypto/types";

export function isValidAddress(address: string, currencyId: string): boolean {
  try {
    return walletIsValidAddress(address, currencyId as Currency);
  } catch {
    // not a currency wallet-btc knows
    return false;
  }
}
