import path from "path";
import {
  getAddressCacheDir,
  isUtxoBasedCurrency,
  matchEntry,
  readCacheFileAt,
} from "./addressCache";
import type { Account, TokenAccount } from "./enum/Account";

/** File name of the dedicated UTXO address cache inside the generated userdata dir. */
export const UTXO_ADDRESS_CACHE_FILE = "utxoAddresses.json";

/**
 * Path of {@link UTXO_ADDRESS_CACHE_FILE}. Shares the same directory resolution
 * as the account-based cache (see {@link getAddressCacheDir}), so it rides the
 * same S3 cache as the app.json files. Returns `null` when the cache is disabled.
 */
export function getUtxoAddressCachePath(): string | null {
  const dir = getAddressCacheDir();
  return dir ? path.join(dir, UTXO_ADDRESS_CACHE_FILE) : null;
}

/**
 * Receive address for a UTXO-based `account` from the dedicated UTXO cache, or
 * `null` when it must be derived live. UTXO addresses get their own cache because
 * they come from the CLI `getAddress` at a fixed path (deterministic per seed),
 * never from app.json `freshAddress`, which rotates as funds arrive.
 */
export function getCachedUtxoAddress(account: Account | TokenAccount): string | null {
  if (account.currency.id.includes("/")) return null;
  if (!isUtxoBasedCurrency(account.currency.id)) return null;

  const entries = readCacheFileAt(getUtxoAddressCachePath())?.addresses?.[account.currency.id];
  const address = Array.isArray(entries) ? matchEntry(entries, account)?.address : undefined;
  return address ?? null;
}
