import { readFile } from "node:fs/promises";
import path from "node:path";
import { log, sleep } from "./exec.ts";
import {
  STORAGE_FILE,
  STORAGE_META_FILE,
  decodeStorage,
  encodeStorage,
  savedState,
  storageEntries,
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

/**
 * Writes a scenario's userdata into a fresh install's storage, then launches it once: no E2E
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
    userdata,
    side,
  }: {
    device: string;
    userdata: Userdata;
    side: Side;
  }): Promise<void> {
    const { data, meta } = encodeStorage(storageEntries(userdata));
    for (const d of devices) await P.stop(d);
    await P.writeStorage(device, { [STORAGE_FILE]: data, [STORAGE_META_FILE]: meta });
    await P.clearDialogs(device);
    await P.launch(device);
    await sleep(FIRST_LAUNCH_MS);
    await P.stop(device);
    await checkSaved({ platform: P, device, side, accounts: userdata.accounts.length });
  };
}

/**
 * Fails when the app dropped the storage file (MMKV discards one whose CRC does not match) or any
 * account of it (one it does not support): A and B must start from the same accounts.
 */
async function checkSaved({
  platform: P,
  device,
  side,
  accounts,
}: {
  platform: Platform;
  device: string;
  side: Side;
  accounts: number;
}): Promise<void> {
  const data = await P.readStorage(device, STORAGE_FILE);
  if (!data) throw new Error(`build ${side} on ${device}: no storage after the first launch`);
  const saved = savedState(decodeStorage(data, await P.readStorage(device, STORAGE_META_FILE)));
  if (!saved.termsAccepted || saved.accounts !== accounts) {
    throw new Error(
      `build ${side} on ${device}: after its first launch the app keeps ${saved.accounts} of the ${accounts} accounts written, terms ${saved.termsAccepted ? "" : "not "}accepted`,
    );
  }
  log(`  ${device}: build ${side} keeps ${saved.accounts} of ${accounts} accounts`);
}
