// The accounts snapshot: the storage a release's E2E build saved once accounts were added through
// its UI (snapshot/run.ts), which the accounts scenario writes into each install.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ACCOUNT_KEY_PREFIX,
  STORAGE_FILE,
  STORAGE_META_FILE,
  decodeStorage,
  encodeStorage,
  isStringValue,
  stringValue,
  type StorageValue,
} from "../measure/storage.ts";

export const MANIFEST_FILE = "snapshot.json";
// A prod build has no Speculos transport: the app would look for the device it was paired with.
const DEVICE_KEYS = new Set(["ble", "knownDevices"]);
const DEVICE_SETTINGS = ["lastConnectedDevice"];

export interface SnapshotManifest {
  /** The release whose E2E build added the accounts, e.g. live-mobile@4.29.0. */
  release: string;
  platform: string;
  createdAt: string;
  /** Account records by currency id. */
  accounts: Record<string, number>;
}

export interface Snapshot {
  entries: Array<[key: string, value: StorageValue]>;
  manifest: SnapshotManifest;
}

/**
 * The app's storage values as it saved them (strings, and numbers such as the last known balance),
 * without the device the accounts were added on.
 */
export function withoutDevice(values: Map<string, Buffer>): Array<[string, StorageValue]> {
  const entries: Array<[string, StorageValue]> = [];
  for (const [key, value] of values) {
    if (DEVICE_KEYS.has(key)) continue;
    if (key !== "settings") {
      entries.push([key, value]);
      continue;
    }
    if (!isStringValue(value)) throw new Error("snapshot: the settings are not a string");
    const settings = JSON.parse(stringValue(value)) as Record<string, unknown>;
    for (const name of DEVICE_SETTINGS) delete settings[name];
    entries.push([key, JSON.stringify(settings)]);
  }
  return entries;
}

/** The `accounts.active.<id>` records by currency, from ids like `js:2:<currency>:<xpub>:<mode>`. */
export function accountsByCurrency(entries: Array<[string, unknown]>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key] of entries) {
    if (!key.startsWith(ACCOUNT_KEY_PREFIX)) continue;
    const currency = key.slice(ACCOUNT_KEY_PREFIX.length).split(":")[2] || "unknown";
    counts[currency] = (counts[currency] ?? 0) + 1;
  }
  return counts;
}

export async function writeSnapshot(dir: string, snapshot: Snapshot): Promise<void> {
  const { data, meta } = encodeStorage(snapshot.entries);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, STORAGE_FILE), data);
  await writeFile(path.join(dir, STORAGE_META_FILE), meta);
  await writeFile(path.join(dir, MANIFEST_FILE), `${JSON.stringify(snapshot.manifest, null, 2)}\n`);
}

export async function readSnapshot(dir: string): Promise<Snapshot> {
  const values = decodeStorage(
    await readFile(path.join(dir, STORAGE_FILE)),
    await readFile(path.join(dir, STORAGE_META_FILE)),
  );
  const manifest = JSON.parse(
    await readFile(path.join(dir, MANIFEST_FILE), "utf8"),
  ) as SnapshotManifest;
  return { entries: [...values], manifest };
}
