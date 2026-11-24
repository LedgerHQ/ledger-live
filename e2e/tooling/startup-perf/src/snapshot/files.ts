// The accounts snapshot: the storage a release's E2E build saved once accounts were added through
// its UI (snapshot/run.ts), which the accounts scenario writes into each install.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ACCOUNT_KEY_PREFIX,
  IDENTITIES_KEY,
  STORAGE_FILE,
  isAccountKey,
  isStringValue,
  readStorageFiles,
  storageFiles,
  stringValue,
  type StorageValue,
} from "../measure/storage.ts";

export const MANIFEST_FILE = "snapshot.json";
// What belongs to the install the accounts were added on. A prod build has no Speculos transport,
// so the app would look for the device it was paired with. Each install makes its own client ids
// (`identities`, formerly `user`), as the no-accounts installs do, and saves them at every start,
// which inject.ts checks to know the app read the storage. And each install makes its own
// trustchain member keypair at its first launch, which known-regression's B (LIVE-36190) makes
// again at every launch: a stored one would hide that regression.
const INSTALL_KEYS = new Set(["ble", "knownDevices", IDENTITIES_KEY, "user", "trustchain"]);
const INSTALL_SETTINGS = ["lastConnectedDevice"];

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
 * without what belongs to the install the accounts were added on.
 */
export function withoutInstallState(values: Map<string, Buffer>): Array<[string, StorageValue]> {
  const entries: Array<[string, StorageValue]> = [];
  for (const [key, value] of values) {
    if (INSTALL_KEYS.has(key)) continue;
    if (key !== "settings") {
      entries.push([key, value]);
      continue;
    }
    if (!isStringValue(value)) throw new Error("snapshot: the settings are not a string");
    const settings = JSON.parse(stringValue(value)) as Record<string, unknown>;
    for (const name of INSTALL_SETTINGS) delete settings[name];
    entries.push([key, JSON.stringify(settings)]);
  }
  return entries;
}

/** The `accounts.active.<id>` records by currency, from ids like `js:2:<currency>:<xpub>:<mode>`. */
export function accountsByCurrency(entries: Array<[string, unknown]>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key] of entries) {
    if (!isAccountKey(key)) continue;
    const currency = key.slice(ACCOUNT_KEY_PREFIX.length).split(":")[2] || "unknown";
    counts[currency] = (counts[currency] ?? 0) + 1;
  }
  return counts;
}

export async function writeSnapshot(dir: string, snapshot: Snapshot): Promise<void> {
  await mkdir(dir, { recursive: true });
  await Promise.all([
    ...Object.entries(storageFiles(snapshot.entries)).map(([name, data]) =>
      writeFile(path.join(dir, name), data),
    ),
    writeFile(path.join(dir, MANIFEST_FILE), `${JSON.stringify(snapshot.manifest, null, 2)}\n`),
  ]);
}

export async function readSnapshot(dir: string): Promise<Snapshot> {
  const values = await readStorageFiles(name => readFile(path.join(dir, name)));
  if (!values) throw new Error(`snapshot: no ${STORAGE_FILE} in ${dir}`);
  const manifest = JSON.parse(
    await readFile(path.join(dir, MANIFEST_FILE), "utf8"),
  ) as SnapshotManifest;
  return { entries: [...values], manifest };
}
