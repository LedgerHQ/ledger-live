// The app's storage, the MMKV instance "ledger-live" (MMKVCore 2.x, unencrypted, single process),
// written as files before the first launch so an install starts with a scenario's userdata saved.
import { crc32 } from "node:zlib";
import type { Userdata } from "./types.ts";

export const STORAGE_FILE = "ledger-live";
export const STORAGE_META_FILE = `${STORAGE_FILE}.crc`;
// generalTermsVersionRequired in src/logic/terms.tsx: what the E2E bridge's acceptTerms saved.
export const GENERAL_TERMS_VERSION = "2022-05-10";
export const ACCOUNT_KEY_PREFIX = "accounts.active.";
export const ACCOUNT_ORDER_KEY = "accounts.sort";
// The client ids, which the app saves at every start (DBSave's saveAtStart): never written here.
export const IDENTITIES_KEY = "identities";
// Set, the app reads MMKV and skips its AsyncStorage migration, as on a fresh install.
export const MIGRATION_DONE: [string, string] = ["migration-status", "completed"];

// A multiple of the 4 KiB (Android x86_64) and 16 KiB (iOS arm64) pages MMKV maps.
const PAGE_SIZE = 16_384;
// MMKVVersionFlag: from MMKVVersionActualSize (3) on, the size is in the meta file, the header is 0.
const META_VERSION = 4;
const SIZE_IN_META_SINCE = 3;
const HEADER_SIZE = 4;
// The first varint of the data: a placeholder MMKV skips.
const ITEM_SIZE_HOLDER = 0x00ffffff;

export interface StorageFiles {
  data: Buffer;
  /** The `.crc` file: MMKVMetaInfo, whose CRC-32 of the data MMKV checks before reading it. */
  meta: Buffer;
}

function varint(value: number): Buffer {
  const bytes: number[] = [];
  let rest = value;
  while (rest > 0x7f) {
    bytes.push((rest % 0x80) | 0x80);
    rest = Math.floor(rest / 0x80);
  }
  bytes.push(rest);
  return Buffer.from(bytes);
}

function readVarint(buffer: Buffer, start: number): [value: number, next: number] {
  let value = 0;
  for (let position = start, shift = 0; position < buffer.length; position++, shift += 7) {
    const byte = buffer[position];
    value += (byte & 0x7f) * 2 ** shift;
    if (byte < 0x80) return [value, position + 1];
  }
  throw new Error(`storage: varint at ${start} runs past the end`);
}

/**
 * A value to write: a string, or the bytes of a value as `decodeStorage` read them, which may be
 * a number or a boolean the app stored.
 */
export type StorageValue = string | Buffer;

/** The bytes of a value: a string is stored as MMKV stores any bytes, its length then the UTF-8. */
function bytesOf(value: StorageValue): Buffer {
  if (typeof value !== "string") return value;
  const utf8 = Buffer.from(value, "utf8");
  return Buffer.concat([varint(utf8.length), utf8]);
}

function encodeEntry(key: string, value: StorageValue): Buffer {
  const keyBytes = Buffer.from(key, "utf8");
  const holder = bytesOf(value);
  return Buffer.concat([varint(keyBytes.length), keyBytes, varint(holder.length), holder]);
}

function padToPages(buffer: Buffer): Buffer {
  const padded = Buffer.alloc(
    Math.max(PAGE_SIZE, Math.ceil(buffer.length / PAGE_SIZE) * PAGE_SIZE),
  );
  buffer.copy(padded);
  return padded;
}

/** The two files of an MMKV instance holding `entries`, in order. */
export function encodeStorage(entries: Array<[key: string, value: StorageValue]>): StorageFiles {
  const body = Buffer.concat([
    varint(ITEM_SIZE_HOLDER),
    ...entries.map(([key, value]) => encodeEntry(key, value)),
  ]);
  const crc = crc32(body);
  const meta = Buffer.alloc(PAGE_SIZE);
  meta.writeUInt32LE(crc, 0);
  meta.writeUInt32LE(META_VERSION, 4);
  meta.writeUInt32LE(1, 8); // sequence
  // 12–27: the IV, unused without encryption.
  meta.writeUInt32LE(body.length, 28); // actual size
  meta.writeUInt32LE(body.length, 32); // last confirmed: actual size
  meta.writeUInt32LE(crc, 36); // last confirmed: CRC
  return { data: padToPages(Buffer.concat([Buffer.alloc(HEADER_SIZE), body])), meta };
}

/** The values of an MMKV instance by key, as bytes: the last write of each key, deletions applied. */
export function decodeStorage(data: Buffer, meta: Buffer | null): Map<string, Buffer> {
  const size =
    meta && meta.length >= 32 && meta.readUInt32LE(4) >= SIZE_IN_META_SINCE
      ? meta.readUInt32LE(28)
      : data.readUInt32LE(0);
  const end = HEADER_SIZE + size;
  if (end > data.length) throw new Error(`storage: size ${size} is past the end of the file`);
  const values = new Map<string, Buffer>();
  let [, position] = readVarint(data, HEADER_SIZE);
  while (position < end) {
    const [keyLength, keyStart] = readVarint(data, position);
    const key = data.toString("utf8", keyStart, keyStart + keyLength);
    const [valueLength, valueStart] = readVarint(data, keyStart + keyLength);
    position = valueStart + valueLength;
    if (valueLength === 0) values.delete(key);
    else values.set(key, data.subarray(valueStart, position));
  }
  return values;
}

/** The files, by name, of a storage directory holding `entries`. */
export function storageFiles(entries: Array<[key: string, value: StorageValue]>) {
  const { data, meta } = encodeStorage(entries);
  return { [STORAGE_FILE]: data, [STORAGE_META_FILE]: meta };
}

/** The values of the storage directory whose files `read` returns: null without its data file. */
export async function readStorageFiles(
  read: (name: string) => Promise<Buffer | null>,
): Promise<Map<string, Buffer> | null> {
  const data = await read(STORAGE_FILE);
  return data && decodeStorage(data, await read(STORAGE_META_FILE));
}

export const isAccountKey = (key: string) => key.startsWith(ACCOUNT_KEY_PREFIX);

/**
 * `entries` with the first account's balance one unit above the stored one. The first launch's
 * sync puts it back, and the app saves an account whose balance changed (it ignores lastSyncDate),
 * so one account is saved again even when nothing changed on chain since the entries were saved.
 */
export function withAccountToResave(
  entries: Array<[key: string, value: StorageValue]>,
): Array<[string, StorageValue]> {
  const index = entries.findIndex(([key]) => isAccountKey(key));
  if (index < 0) return entries;
  const [key, value] = entries[index];
  if (typeof value !== "string" && !isStringValue(value)) {
    throw new Error(`storage: account ${key} is not a string`);
  }
  const record = JSON.parse(typeof value === "string" ? value : stringValue(value)) as {
    data?: { balance?: unknown };
  };
  if (!record.data || typeof record.data.balance !== "string") {
    throw new Error(`storage: account ${key} has no balance`);
  }
  record.data.balance = (BigInt(record.data.balance) + 1n).toString();
  return entries.map((entry, i) => (i === index ? [key, JSON.stringify(record)] : entry));
}

export function stringValue(value: Buffer): string {
  const [length, start] = readVarint(value, 0);
  return value.toString("utf8", start, start + length);
}

/** Whether a value is one string, as the app stores every value: its length covers the rest. */
export function isStringValue(value: Buffer): boolean {
  const [length, start] = readVarint(value, 0);
  return start + length === value.length;
}

/** What a fresh install saves once the E2E bridge imported `userdata`, terms accepted. */
export function storageEntries(userdata: Userdata): Array<[string, string]> {
  const entries: Array<[string, string]> = [MIGRATION_DONE];
  const json = (key: string, value: unknown) => entries.push([key, JSON.stringify(value)]);
  json("settings", { ...userdata.settings, generalTermsVersionAccepted: GENERAL_TERMS_VERSION });
  const ids: string[] = [];
  for (const { data, version } of userdata.accounts) {
    if (!data?.id) throw new Error("storage: an account of the userdata has no id");
    ids.push(data.id);
    json(`${ACCOUNT_KEY_PREFIX}${data.id}`, { data, version: version ?? 1 });
  }
  json(ACCOUNT_ORDER_KEY, ids);
  if (userdata.postOnboarding !== undefined) json("postOnboarding", userdata.postOnboarding);
  return entries;
}

export interface SavedState {
  accounts: number;
  /** Account records the app saved again, so differing from the ones written. */
  resaved: number;
  termsAccepted: boolean;
  /** The app saved its client ids, which no written entry holds: it opened this storage. */
  idsSaved: boolean;
}

/**
 * The accounts and terms the app keeps in its storage, against the `written` entries: none of
 * either when it dropped the file. It loads one account per `accounts.active.*` record
 * (`accounts.sort` only orders them), and saves accounts only once one changes (a sync), deleting
 * then the record of any account it did not load: a resaved record shows that deletion ran.
 */
export function savedState(
  values: Map<string, Buffer>,
  written: Array<[string, StorageValue]>,
): SavedState {
  const writtenValues = new Map(written.map(([key, value]) => [key, bytesOf(value)]));
  const value = values.get("settings");
  const settings = value
    ? (JSON.parse(stringValue(value)) as { generalTermsVersionAccepted?: unknown })
    : undefined;
  const accountKeys = [...values.keys()].filter(isAccountKey);
  return {
    accounts: accountKeys.length,
    resaved: accountKeys.filter(key => {
      const saved = values.get(key);
      const before = writtenValues.get(key);
      return saved !== undefined && !(before && saved.equals(before));
    }).length,
    termsAccepted: settings?.generalTermsVersionAccepted === GENERAL_TERMS_VERSION,
    idsSaved: values.has(IDENTITIES_KEY) && !writtenValues.has(IDENTITIES_KEY),
  };
}
