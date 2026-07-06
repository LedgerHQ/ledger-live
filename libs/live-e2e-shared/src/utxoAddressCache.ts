import path from "path";
import {
  getAddressCacheDir,
  isUtxoBasedCurrency,
  matchEntry,
  readCacheFileAt,
} from "./addressCache";
import type { Account, TokenAccount } from "./enum/Account";

export const UTXO_ADDRESS_CACHE_FILE = "utxoAddresses.json";

export function getUtxoAddressCachePath(): string | null {
  const dir = getAddressCacheDir();
  return dir ? path.join(dir, UTXO_ADDRESS_CACHE_FILE) : null;
}

export function getCachedUtxoAddress(account: Account | TokenAccount): string | null {
  if (account.currency.id.includes("/")) return null;
  if (!isUtxoBasedCurrency(account.currency.id)) return null;

  const entries = readCacheFileAt(getUtxoAddressCachePath())?.addresses?.[account.currency.id];
  const address = Array.isArray(entries) ? matchEntry(entries, account)?.address : undefined;
  return address ?? null;
}
