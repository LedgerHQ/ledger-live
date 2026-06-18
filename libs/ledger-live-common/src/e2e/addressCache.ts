import fs from "fs";
import path from "path";
import { getFamilyByCurrencyId, isUTXOCompliant } from "../currencies/helpers";
import type { Account, TokenAccount } from "./enum/Account";

const ENV_DIR = "E2E_GENERATED_ADDRESSES_DIR";
const ENV_USERDATA_DIR = "E2E_GENERATED_USERDATA_DIR";

/** File name of the dedicated address cache inside the generated userdata dir. */
export const ADDRESS_CACHE_FILE = "addresses.json";

export type AddressEntry = {
  index: number;
  derivationMode: string;
  address: string;
};

export type AddressCacheFile = {
  version: number;
  /** Keyed by `currency.id`; one entry per (index, derivationMode). */
  addresses: Record<string, AddressEntry[]>;
};

/**
 * Families whose receive address rotates (UTXO/eUTXO), so a cached value can
 * drift and must always be derived live. Kaspa is UTXO but in its own family.
 */
export function isUtxoBasedCurrency(currencyId: string): boolean {
  const family = getFamilyByCurrencyId(currencyId);
  if (!family) return false;
  return isUTXOCompliant(family) || family === "kaspa";
}

/**
 * Directory holding {@link ADDRESS_CACHE_FILE}. Defaults to the shared generated
 * userdata dir (so the address cache rides the same S3 cache as the app.json
 * files), but can be pointed elsewhere via `E2E_GENERATED_ADDRESSES_DIR`. When
 * neither is set the cache is disabled and callers derive addresses live.
 */
export function getAddressCacheDir(): string | null {
  const dir = process.env[ENV_DIR]?.trim() || process.env[ENV_USERDATA_DIR]?.trim();
  return dir ? dir : null;
}

export function getAddressCachePath(): string | null {
  const dir = getAddressCacheDir();
  return dir ? path.join(dir, ADDRESS_CACHE_FILE) : null;
}

/** Read and parse an address-cache file, or `null` when missing/unreadable. */
export function readCacheFileAt(file: string | null): AddressCacheFile | null {
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as AddressCacheFile;
  } catch {
    return null;
  }
}

/**
 * Pick the cached entry matching `account`. Mirrors the matching used for the
 * app.json cache: filter by index, then disambiguate on derivationMode only
 * when several entries share that index.
 */
export function matchEntry(
  entries: AddressEntry[],
  account: Account | TokenAccount,
): AddressEntry | undefined {
  const sameIndex = entries.filter(e => e.index === account.index);
  if (sameIndex.length <= 1 || account.derivationMode == null) return sameIndex[0];
  return sameIndex.find(e => (e.derivationMode ?? "") === account.derivationMode) ?? sameIndex[0];
}

/**
 * Receive address for `account` from the dedicated address cache, or `null` when
 * the caller must derive it live. Returns `null` for UTXO-based coins (always
 * resolved via the CLI), for token sub-accounts (resolved through their parent),
 * and on any cache miss.
 */
export function getCachedAddress(account: Account | TokenAccount): string | null {
  if (account.currency.id.includes("/")) return null;
  if (isUtxoBasedCurrency(account.currency.id)) return null;

  const entries = readCacheFileAt(getAddressCachePath())?.addresses?.[account.currency.id];
  const address = Array.isArray(entries) ? matchEntry(entries, account)?.address : undefined;
  return address ?? null;
}

/**
 * Insert/replace an address entry in `cache` (used by the generator). Idempotent
 * on (currencyId, index, derivationMode). Mutates and returns `cache`.
 */
export function setCachedAddressEntry(
  cache: AddressCacheFile,
  currencyId: string,
  entry: AddressEntry,
): AddressCacheFile {
  const list = (cache.addresses[currencyId] ??= []);
  const existing = list.findIndex(
    e => e.index === entry.index && (e.derivationMode ?? "") === (entry.derivationMode ?? ""),
  );
  if (existing === -1) list.push(entry);
  else list[existing] = entry;
  return cache;
}
