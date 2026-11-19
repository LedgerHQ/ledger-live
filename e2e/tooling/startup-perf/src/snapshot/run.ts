#!/usr/bin/env node
// Makes the accounts snapshot on one device: a release's E2E build adds accounts through its UI,
// each coin on its own Speculos, and its storage is kept without that device. See README.md.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { insideWorkingDir, log, sleep } from "../measure/exec.ts";
import { loadUserdata } from "../measure/inject.ts";
import { FLOWS_DIR, createMaestro } from "../measure/maestro.ts";
import { createAndroid } from "../measure/platforms/android.ts";
import { createIos } from "../measure/platforms/ios.ts";
import {
  STORAGE_FILE,
  STORAGE_META_FILE,
  decodeStorage,
  encodeStorage,
  storageEntries,
} from "../measure/storage.ts";
import type { PlatformName } from "../types.ts";
import { startBridge } from "./bridge.ts";
import { accountsByCurrency, withoutDevice, writeSnapshot } from "./files.ts";
import { createSpeculos } from "./speculos.ts";

export interface Coin {
  /** The Speculos spec of libs/live-e2e-shared/src/speculos.ts. */
  app: string;
  ticker: string;
  /** The network to pick when the coin asks for one. */
  network?: string;
  currency: string;
}

// The coins of the accounts scenario's former userdata (speculos-x-other-account, swap-history).
export const COINS: Coin[] = [
  { app: "Bitcoin", ticker: "BTC", currency: "bitcoin" },
  { app: "Ethereum", ticker: "ETH", network: "Ethereum", currency: "ethereum" },
  { app: "Solana", ticker: "SOL", currency: "solana" },
];

const ADD_ACCOUNTS_FLOW = path.join(FLOWS_DIR, "add-accounts.yaml");
// Its scan waits up to 240 s; the deep link, the asset list and the success screen take the rest.
const ADD_ACCOUNTS_TIMEOUT_MS = 420_000;
const APP_CONNECT_TIMEOUT_MS = 120_000;
// The app disconnects the previous Speculos before acknowledging.
const BRIDGE_ACK_TIMEOUT_MS = 60_000;
// Above the throttles of the app's saves (DBSave.ts: 2 s at most), with a sync after the last coin.
const SAVE_MS = 20_000;

const { values: opts } = parseArgs({
  options: {
    platform: { type: "string" },
    device: { type: "string" },
    app: { type: "string" },
    "app-id": { type: "string", default: "com.ledger.live" },
    release: { type: "string" },
    "userdata-dir": { type: "string", default: "e2e/mobile/userdata" },
    "start-userdata": { type: "string", default: "skip-onboarding" },
    maestro: { type: "string", default: "maestro" },
    "out-dir": { type: "string", default: "startup-perf-snapshot" },
    "debug-dir": { type: "string", default: "startup-perf-snapshot-debug" },
  },
});

const PLATFORM = opts.platform as PlatformName;
const DEVICE = opts.device ?? "";
const APP = opts.app ?? "";
const RELEASE = opts.release ?? "";
const OUT_DIR = insideWorkingDir(opts["out-dir"]);
const DEBUG_DIR = insideWorkingDir(opts["debug-dir"]);

function validateOptions(): void {
  if (!["android", "ios"].includes(PLATFORM)) throw new Error("--platform must be android or ios");
  if (!DEVICE || DEVICE.includes(",")) throw new Error("--device needs one device id");
  if (!APP) throw new Error("--app is required: the E2E build of the release");
  if (!RELEASE) throw new Error("--release is required, e.g. live-mobile@4.29.0");
}

const maestro = createMaestro({ binary: opts.maestro, platform: PLATFORM, devices: [DEVICE] });
const P =
  PLATFORM === "android"
    ? createAndroid({ appId: opts["app-id"] })
    : createIos({ appId: opts["app-id"], maestro });

async function addAccounts(
  coin: Coin,
  bridge: Awaited<ReturnType<typeof startBridge>>,
  speculos: ReturnType<typeof createSpeculos>,
): Promise<void> {
  log(`${coin.app}: starting its Speculos`);
  const session = await speculos.start(coin.app);
  try {
    await bridge.send(
      "addKnownSpeculos",
      JSON.stringify({
        address: session.address,
        model: session.model,
        sessionToken: session.sessionToken,
      }),
      BRIDGE_ACK_TIMEOUT_MS,
    );
    log(`${coin.app}: the app registered its Speculos, adding the accounts`);
    const debugDir = path.join(DEBUG_DIR, coin.ticker);
    const flow = await maestro.invoke({
      device: DEVICE,
      command: "test",
      args: [
        "-e",
        `TICKER=${coin.ticker}`,
        ...(coin.network ? ["-e", `NETWORK=${coin.network}`] : []),
        "--debug-output",
        debugDir,
        ADD_ACCOUNTS_FLOW,
      ],
      timeoutMs: ADD_ACCOUNTS_TIMEOUT_MS,
    });
    if (flow.failed) {
      await mkdir(debugDir, { recursive: true });
      await writeFile(path.join(debugDir, "maestro.log"), `${flow.stdout}\n${flow.stderr}\n`);
      throw new Error(`adding the ${coin.app} accounts failed (see ${debugDir})`);
    }
  } finally {
    await speculos.stop(session.id);
  }
}

async function main(): Promise<void> {
  validateOptions();
  await mkdir(DEBUG_DIR, { recursive: true });
  const userdata = await loadUserdata({
    dir: insideWorkingDir(opts["userdata-dir"]),
    names: opts["start-userdata"],
  });
  log(`installing ${APP} (${RELEASE}) on ${DEVICE}`);
  await P.install(DEVICE, APP);
  await P.stop(DEVICE);
  const { data, meta } = encodeStorage(storageEntries(userdata));
  await P.writeStorage(DEVICE, { [STORAGE_FILE]: data, [STORAGE_META_FILE]: meta });

  const bridge = await startBridge();
  const speculos = createSpeculos({ repoRoot: process.cwd(), workDir: DEBUG_DIR });
  try {
    await P.clearDialogs(DEVICE);
    await P.ensureScreenOn(DEVICE);
    // mock=0: E2E builds start with MOCK, whose bridges would add mock accounts.
    await P.launch(DEVICE, { wsPort: bridge.port, wsToken: bridge.token, mock: "0" });
    await bridge.waitForApp(APP_CONNECT_TIMEOUT_MS);
    for (const coin of COINS) await addAccounts(coin, bridge, speculos);
    await sleep(SAVE_MS);
  } catch (error) {
    await P.diagnostics(DEVICE, path.join(DEBUG_DIR, "device.log")).catch(() => {});
    throw error;
  } finally {
    await bridge.close();
  }
  await P.stop(DEVICE);

  const stored = await P.readStorage(DEVICE, STORAGE_FILE);
  if (!stored) throw new Error("the app has no storage after adding the accounts");
  const entries = withoutDevice(
    decodeStorage(stored, await P.readStorage(DEVICE, STORAGE_META_FILE)),
  );
  const accounts = accountsByCurrency(entries);
  const missing = COINS.filter(coin => !accounts[coin.currency]).map(coin => coin.app);
  if (missing.length) {
    throw new Error(`no ${missing.join(", ")} account saved: ${JSON.stringify(accounts)}`);
  }
  await writeSnapshot(OUT_DIR, {
    entries,
    manifest: {
      release: RELEASE,
      platform: PLATFORM,
      createdAt: new Date().toISOString(),
      accounts,
    },
  });
  log(`snapshot of ${RELEASE} written to ${OUT_DIR}: ${JSON.stringify(accounts)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
