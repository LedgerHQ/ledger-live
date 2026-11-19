import { readFile } from "node:fs/promises";
import path from "node:path";
import { log, sleep } from "./exec.ts";
import { readSnapshot } from "../snapshot/files.ts";
import {
  ACCOUNT_KEY_PREFIX,
  STORAGE_FILE,
  STORAGE_META_FILE,
  decodeStorage,
  encodeStorage,
  savedState,
  storageEntries,
  type StorageValue,
} from "./storage.ts";
import type { Side } from "../types.ts";
import type { Platform, Userdata } from "./types.ts";

// The first launch after an install, not measured: it syncs the accounts and saves what the app
// builds itself (countervalues, token cache), as the injection launch of the E2E bridge did.
const FIRST_LAUNCH_MS = 30_000;

/**
 * Merges the userdata files of a scenario: settings and post-onboarding come from the first.
 * `names` lists the file names, comma-separated, without .json.
 */
export async function loadUserdata({
  dir,
  names,
}: {
  dir: string;
  names: string;
}): Promise<Userdata> {
  const files = names
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  let settings: Record<string, unknown> = {};
  let postOnboarding: unknown;
  const accounts: Userdata["accounts"] = [];
  const seen = new Set<string>();
  for (const [index, name] of files.entries()) {
    const { data } = JSON.parse(await readFile(path.join(dir, `${name}.json`), "utf8"));
    if (index === 0) {
      settings = data.settings ?? {};
      postOnboarding = data.postOnboarding;
    }
    for (const account of data.accounts ?? []) {
      const id = account?.data?.id;
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      accounts.push(account);
    }
  }
  // Defaults of loadConfig in e2e/mobile/bridge/server.ts; no feature flags: production Firebase's.
  return {
    names: files,
    settings: { shareAnalytics: false, hasSeenAnalyticsOptInPrompt: true, ...settings },
    accounts,
    postOnboarding,
  };
}

/** What a scenario's installs start from: the storage entries, and the accounts they hold. */
export interface StartingStorage {
  /** Where the entries come from, for the log. */
  source: string;
  entries: Array<[string, StorageValue]>;
  accounts: number;
}

export function userdataStorage(userdata: Userdata): StartingStorage {
  return {
    source: userdata.names.join(", "),
    entries: storageEntries(userdata),
    accounts: userdata.accounts.length,
  };
}

/** The accounts snapshot of src/snapshot/run.ts, as the release's E2E build saved it. */
export async function snapshotStorage(dir: string): Promise<StartingStorage> {
  const { entries, manifest } = await readSnapshot(dir);
  return {
    source: `the ${manifest.release} accounts snapshot`,
    entries,
    accounts: entries.filter(([key]) => key.startsWith(ACCOUNT_KEY_PREFIX)).length,
  };
}

/**
 * Writes a scenario's starting storage into a fresh install, then launches it once: no E2E
 * bridge, so the builds need none.
 */
export function createInjector({
  platform: P,
  devices,
}: {
  platform: Platform;
  devices: string[];
}) {
  return async function inject({
    device,
    storage,
    side,
  }: {
    device: string;
    storage: StartingStorage;
    side: Side;
  }): Promise<void> {
    const written = storage.entries;
    const { data, meta } = encodeStorage(written);
    for (const d of devices) await P.stop(d);
    await P.writeStorage(device, { [STORAGE_FILE]: data, [STORAGE_META_FILE]: meta });
    await P.clearDialogs(device);
    await P.launch(device);
    await sleep(FIRST_LAUNCH_MS);
    await P.stop(device);
    await checkSaved({ platform: P, device, side, written, accounts: storage.accounts });
  };
}

/**
 * Fails when the app dropped the storage file (MMKV discards one whose CRC does not match) or any
 * account of it (one it does not support): A and B must start from the same accounts. A dropped
 * account's record stays until the app saves accounts, so one must have been saved again.
 */
async function checkSaved({
  platform: P,
  device,
  side,
  written,
  accounts,
}: {
  platform: Platform;
  device: string;
  side: Side;
  written: Array<[string, StorageValue]>;
  accounts: number;
}): Promise<void> {
  const data = await P.readStorage(device, STORAGE_FILE);
  if (!data) throw new Error(`build ${side} on ${device}: no storage after the first launch`);
  const saved = savedState(
    decodeStorage(data, await P.readStorage(device, STORAGE_META_FILE)),
    written,
  );
  const kept = `keeps ${saved.accounts} of ${accounts} accounts (${saved.resaved} saved again)`;
  if (!saved.termsAccepted || saved.accounts !== accounts || (accounts > 0 && !saved.resaved)) {
    throw new Error(
      `build ${side} on ${device}: after its first launch the app ${kept}, terms ${saved.termsAccepted ? "" : "not "}accepted: it must keep the terms and every account, and save one again (a sync) to show it loaded them`,
    );
  }
  log(`  ${device}: build ${side} ${kept}`);
}
