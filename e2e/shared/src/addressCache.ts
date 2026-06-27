import fs from "fs";
import path from "path";
import { getFamilyByCurrencyId, isUTXOCompliant } from "@ledgerhq/live-common/currencies/helpers";
import type { Account, TokenAccount } from "./enum/Account";

const ENV_DIR = "E2E_GENERATED_ADDRESSES_DIR";
const ENV_USERDATA_DIR = "E2E_GENERATED_USERDATA_DIR";

export const ADDRESS_CACHE_FILE = "addresses.json";

export type AddressEntry = {
  index: number;
  derivationMode: string;
  address: string;
};

export type AddressCacheFile = {
  version: number;
  addresses: Record<string, AddressEntry[]>;
};

export function isUtxoBasedCurrency(currencyId: string): boolean {
  const family = getFamilyByCurrencyId(currencyId);
  if (!family) return false;
  return isUTXOCompliant(family) || family === "kaspa";
}

export function getAddressCacheDir(): string | null {
  const dir = process.env[ENV_DIR]?.trim() || process.env[ENV_USERDATA_DIR]?.trim();
  return dir ? dir : null;
}

export function getAddressCachePath(): string | null {
  const dir = getAddressCacheDir();
  return dir ? path.join(dir, ADDRESS_CACHE_FILE) : null;
}

export function readCacheFileAt(file: string | null): AddressCacheFile | null {
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as AddressCacheFile;
  } catch {
    return null;
  }
}

export function matchEntry(
  entries: AddressEntry[],
  account: Account | TokenAccount,
): AddressEntry | undefined {
  const sameIndex = entries.filter(e => e.index === account.index);
  if (sameIndex.length <= 1 || account.derivationMode == null) return sameIndex[0];
  return sameIndex.find(e => (e.derivationMode ?? "") === account.derivationMode) ?? sameIndex[0];
}

export function getCachedAddress(account: Account | TokenAccount): string | null {
  if (account.currency.id.includes("/")) return null;
  if (isUtxoBasedCurrency(account.currency.id)) return null;

  const entries = readCacheFileAt(getAddressCachePath())?.addresses?.[account.currency.id];
  const address = Array.isArray(entries) ? matchEntry(entries, account)?.address : undefined;
  return address ?? null;
}

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
