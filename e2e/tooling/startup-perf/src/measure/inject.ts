import { readFile } from "node:fs/promises";
import path from "node:path";
import { log, sleep } from "./exec.ts";
import { readSnapshot } from "../snapshot/files.ts";
import {
  isAccountKey,
  readStorageFiles,
  savedState,
  storageEntries,
  storageFiles,
  withAccountsToResave,
  type SavedState,
  type StorageValue,
} from "./storage.ts";
import type { Side } from "../types.ts";
import type { Platform, Userdata } from "./types.ts";

// The first launch after an install, not measured: it syncs the accounts and saves what the app
// builds itself (countervalues, token cache), as the injection launch of the E2E bridge did.
const FIRST_LAUNCH_MS = 30_000;
// A slower first sync (an account with many operations, a slow explorer) gets until then to save
// an account again: from the 30 s on, the storage is read every few seconds until it shows that.
const FIRST_LAUNCH_MAX_MS = 180_000;
const STORAGE_POLL_MS = 5_000;

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
    accounts: entries.filter(([key]) => isAccountKey(key)).length,
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
    const written = withAccountsToResave(storage.entries);
    const check = { platform: P, device, written, accounts: storage.accounts };
    for (const d of devices) await P.stop(d);
    await P.writeStorage(device, storageFiles(written));
    await P.clearDialogs(device);
    await P.launch(device);
    const launched = Date.now();
    await sleep(FIRST_LAUNCH_MS);
    while (Date.now() - launched < FIRST_LAUNCH_MAX_MS && !(await hasLoaded(check))) {
      await sleep(STORAGE_POLL_MS);
    }
    await P.stop(device);
    await checkSaved({ ...check, side, seconds: Math.round((Date.now() - launched) / 1000) });
  };
}

interface Check {
  platform: Platform;
  device: string;
  written: Array<[string, StorageValue]>;
  accounts: number;
}

/**
 * Whether the app loaded the storage written: it saved its client ids into it (it saves them at
 * every start, so it opened this storage) and kept the terms and every account. MMKV discards a
 * file whose CRC does not match, the app an account it does not support, and A and B must start
 * from the same accounts. A dropped account's record stays until the app saves accounts, so one
 * must have been saved again: one of those withAccountsToResave raised the balance of, once its
 * chain's sync has put it back.
 */
const loaded = (saved: SavedState, accounts: number): boolean =>
  saved.idsSaved &&
  saved.termsAccepted &&
  saved.accounts === accounts &&
  (accounts === 0 || saved.resaved > 0);

/** `loaded` while the app runs: a read in the middle of a save reads as not yet. */
async function hasLoaded({ platform: P, device, written, accounts }: Check): Promise<boolean> {
  try {
    const values = await readStorageFiles(name => P.readStorage(device, name));
    return values !== null && loaded(savedState(values, written), accounts);
  } catch {
    return false;
  }
}

async function checkSaved({
  platform: P,
  device,
  side,
  written,
  accounts,
  seconds,
}: Check & { side: Side; seconds: number }): Promise<void> {
  const values = await readStorageFiles(name => P.readStorage(device, name));
  if (!values) throw new Error(`build ${side} on ${device}: no storage after the first launch`);
  const saved = savedState(values, written);
  const kept = `keeps ${saved.accounts} of ${accounts} accounts (${saved.resaved} saved again) after ${seconds} s`;
  if (!loaded(saved, accounts)) {
    throw new Error(
      `build ${side} on ${device}: after its first launch the app ${kept}, terms ${saved.termsAccepted ? "" : "not "}accepted, client ids ${saved.idsSaved ? "" : "not "}saved: it must save its client ids into this storage, keep the terms and every account, and save one again (a sync) to show it loaded them`,
    );
  }
  log(`  ${device}: build ${side} ${kept}`);
}
