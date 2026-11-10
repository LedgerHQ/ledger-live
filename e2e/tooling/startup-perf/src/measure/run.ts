#!/usr/bin/env node
// Writes one JSON line per launch to <out-dir>/samples.jsonl. See README.md.
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createAndroid } from "./platforms/android.ts";
import { errorMessage, insideWorkingDir, log, sleep } from "./exec.ts";
import { createInjector, loadUserdata } from "./inject.ts";
import { createIos } from "./platforms/ios.ts";
import { createMaestro } from "./maestro.ts";
import { createPerformanceReader } from "./performance-screen.ts";
import { createStartupLogReader } from "./startup-log.ts";
import type { PlatformName, Sample, SampleMeta, Side } from "../types.ts";
import type { Userdata } from "./types.ts";

const { values: opts } = parseArgs({
  options: {
    platform: { type: "string" },
    devices: { type: "string" },
    "app-a": { type: "string" },
    "app-b": { type: "string" },
    "app-id": { type: "string", default: "com.ledger.live" },
    scenarios: { type: "string", default: "no-accounts,accounts" },
    "userdata-dir": { type: "string", default: "e2e/mobile/userdata" },
    "no-accounts-userdata": { type: "string", default: "skip-onboarding" },
    "accounts-userdata": {
      type: "string",
      default: "speculos-x-other-account,swap-history",
    },
    pairs: { type: "string", default: "20" },
    warmups: { type: "string", default: "1" },
    "idle-ms": { type: "string", default: "2000" },
    "settle-ms": { type: "string", default: "5000" },
    read: { type: "string", default: "log" },
    maestro: { type: "string", default: "maestro" },
    "bridge-port": { type: "string", default: "8099" },
    "out-dir": { type: "string", default: "startup-perf-results" },
  },
});

// validateOptions() checks it before any device is touched.
const PLATFORM = opts.platform as PlatformName;
const DEVICES = (opts.devices ?? "").split(",").filter(Boolean);
const APPS: Record<Side, string> = { A: opts["app-a"] ?? "", B: opts["app-b"] ?? "" };
const APP_ID = opts["app-id"];
const SCENARIOS = opts.scenarios
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const PAIRS = Number(opts.pairs);
const WARMUPS = Number(opts.warmups);
const IDLE_MS = Number(opts["idle-ms"]);
const SETTLE_MS = Number(opts["settle-ms"]);
const READ = opts.read;
const BRIDGE_PORT = Number(opts["bridge-port"]);
const OUT_DIR = insideWorkingDir(opts["out-dir"]);
const SAMPLES_FILE = path.join(OUT_DIR, "samples.jsonl");
const DEBUG_DIR = path.join(OUT_DIR, "debug");
const MAX_CONSECUTIVE_FAILURES = 4;
// After the settle time: the line comes as soon as the startup is over.
const LOG_READ_TIMEOUT_MS = 20_000;
const DIALOG_RECOVERY_MS = 30_000;

function validateOptions(): void {
  if (!["android", "ios"].includes(PLATFORM)) throw new Error("--platform must be android or ios");
  if (DEVICES.length !== 2) throw new Error("--devices needs exactly two ids, comma-separated");
  if (!APPS.A || !APPS.B) {
    throw new Error("--app-a and --app-b are required (pass the same path twice for A/A)");
  }
  if (!Number.isInteger(PAIRS) || PAIRS < 2 || PAIRS % 2) {
    throw new Error("--pairs must be an even number ≥ 2");
  }
  if (!["log", "screen", "both"].includes(READ)) {
    throw new Error("--read must be log, screen or both");
  }
  for (const s of SCENARIOS) {
    if (!["no-accounts", "accounts"].includes(s)) throw new Error(`unknown scenario ${s}`);
  }
}

const maestro = createMaestro({ binary: opts.maestro, platform: PLATFORM, devices: DEVICES });
const P =
  PLATFORM === "android" ? createAndroid({ appId: APP_ID }) : createIos({ appId: APP_ID, maestro });
const readPerformance = createPerformanceReader({ platform: P, maestro });
const readStartupLog = createStartupLogReader(P);
const inject = createInjector({ platform: P, devices: DEVICES, port: BRIDGE_PORT });

const consecutiveFailures = new Map<string, number>();
// On iOS a read of the Debug screen slows the next launch, on either simulator (README.md).
let screenReadSinceLaunch = false;
// Becomes "screen" for the rest of a scenario once a build's warm-up wrote no startup lines:
// both builds are then read on the screen, so every pair stays even.
let read = READ;

async function sample(meta: SampleMeta, { checkScreen = false } = {}): Promise<Sample> {
  const record: Sample = {
    platform: PLATFORM,
    ...meta,
    startedAt: new Date().toISOString(),
    ok: false,
  };
  const name = `${meta.scenario}-p${meta.phase}-r${meta.round}-${meta.side}`;
  const other = meta.device === DEVICES[0] ? DEVICES[1] : DEVICES[0];
  maestro.calls = [];
  let readStart: number | null = null;
  let paused = false;
  try {
    for (const device of DEVICES) await P.stop(device);
    const dialogs: string[] = [];
    for (const device of DEVICES) dialogs.push(...(await P.clearDialogs(device)));
    if (dialogs.length) {
      record.clearedDialogs = dialogs;
      await sleep(DIALOG_RECOVERY_MS);
    }
    record.screen = await P.ensureScreenOn(meta.device);
    await sleep(IDLE_MS);
    paused = await P.pause(other).catch((error: unknown) => {
      log(`  could not pause ${other}, launching with it running: ${errorMessage(error)}`);
      return false;
    });
    record.otherPaused = paused;
    record.afterScreenRead = screenReadSinceLaunch;
    screenReadSinceLaunch = false;
    const launch = await P.launch(meta.device);
    await sleep(SETTLE_MS);
    const processStart = await P.processStart(meta.device);
    record.processStartAt = processStart?.at ?? null;
    record.processStartAppClockAt = processStart?.appClockAt ?? null;
    // The read flow opens a deep link, which would start the app again if it had exited.
    record.pid = processStart?.pid ?? (await P.pid(meta.device));
    if (record.pid === null)
      throw new Error("the app was not running at the end of the settle time");
    if (paused) {
      // Cleared only once resumed, so `finally` retries a failed resume.
      await P.resume(other);
      paused = false;
    }
    readStart = Date.now();
    const perf = await readStartup({
      meta,
      pid: record.pid,
      checkScreen: checkScreen || READ === "both",
      debugFile: path.join(DEBUG_DIR, `${name}.txt`),
    });
    const pidAtRead = await P.pid(meta.device);
    if (pidAtRead !== record.pid) {
      throw new Error(`the app process changed before the read (pid ${record.pid} → ${pidAtRead})`);
    }
    Object.assign(record, launch, perf, { ok: true });
    consecutiveFailures.set(meta.device, 0);
  } catch (error) {
    record.error = errorMessage(error).slice(0, 1500);
    consecutiveFailures.set(meta.device, (consecutiveFailures.get(meta.device) ?? 0) + 1);
    await P.diagnostics(meta.device, path.join(DEBUG_DIR, `${name}.log`)).catch(() => {});
  } finally {
    // A device left paused would hang every later adb command sent to it.
    if (paused) await P.resume(other);
  }
  if (readStart !== null) record.readMs = Date.now() - readStart;
  record.maestroCalls = maestro.calls;
  await appendFile(SAMPLES_FILE, JSON.stringify(record) + "\n");
  const what = record.ok
    ? `${record.appStartupTime} ms`
    : `FAILED: ${record.error?.split("\n")[0]}`;
  log(`${meta.warmup ? "warm-up " : ""}${name} on ${meta.device}: ${what}`);
  if ((consecutiveFailures.get(meta.device) ?? 0) >= MAX_CONSECUTIVE_FAILURES) {
    throw new Error(
      `${MAX_CONSECUTIVE_FAILURES} launches in a row failed on ${meta.device}; stopping (see ${DEBUG_DIR})`,
    );
  }
  return record;
}

/**
 * The startup from the device log, or from the Debug screen when the line never came. With
 * `checkScreen` the screen is read too, to check it shows the same time.
 */
async function readStartup({
  meta,
  pid,
  checkScreen,
  debugFile,
}: {
  meta: SampleMeta;
  pid: number;
  checkScreen: boolean;
  debugFile: string;
}): Promise<Pick<Sample, "appStartupTime" | "events" | "readFrom" | "screenAppStartupTime">> {
  const readScreen = () => {
    screenReadSinceLaunch = true;
    return readPerformance(meta.device, { quick: !meta.warmup, debugFile });
  };
  if (read === "screen") return { ...(await readScreen()), readFrom: "screen" };
  const fromLog = await readStartupLog(meta.device, pid, LOG_READ_TIMEOUT_MS).catch(
    (error: unknown) => {
      log(`  unreadable startup lines in the device log: ${errorMessage(error)}`);
      return null;
    },
  );
  if (!fromLog) {
    log(
      `  no startup lines in the device log ${LOG_READ_TIMEOUT_MS} ms after the settle time: reading the screen`,
    );
    if (meta.warmup) {
      log(`  build ${meta.side} does not log its startup: both builds are read on the screen`);
      read = "screen";
    }
    return { ...(await readScreen()), readFrom: "screen-fallback" };
  }
  if (!checkScreen) return { ...fromLog, readFrom: "log" };
  const onScreen = await readScreen();
  if (onScreen.appStartupTime !== fromLog.appStartupTime) {
    log(
      `  the Debug screen shows ${onScreen.appStartupTime} ms, the log ${fromLog.appStartupTime} ms`,
    );
  }
  return { ...fromLog, readFrom: "log", screenAppStartupTime: onScreen.appStartupTime };
}

function writeMeta(): Promise<void> {
  return writeFile(
    path.join(OUT_DIR, "meta.json"),
    JSON.stringify(
      {
        platform: PLATFORM,
        devices: DEVICES,
        apps: { A: path.basename(APPS.A), B: path.basename(APPS.B) },
        sameBinary: path.resolve(APPS.A) === path.resolve(APPS.B),
        scenarios: SCENARIOS,
        pairs: PAIRS,
        warmups: WARMUPS,
        idleMs: IDLE_MS,
        settleMs: SETTLE_MS,
        read: READ,
        userdata: {
          "no-accounts": opts["no-accounts-userdata"],
          accounts: opts["accounts-userdata"],
        },
      },
      null,
      2,
    ),
  );
}

/** Phase 0 puts A on the first device, phase 1 on the second; the side that went last goes first. */
function layout(phase: number): { placement: Record<Side, string>; order: Side[] } {
  return phase === 0
    ? { placement: { A: DEVICES[0], B: DEVICES[1] }, order: ["A", "B"] }
    : { placement: { A: DEVICES[1], B: DEVICES[0] }, order: ["B", "A"] };
}

/** Installs a build and imports the scenario's userdata into it, retrying the import once. */
async function installAndInject({
  scenario,
  side,
  device,
  userdata,
}: {
  scenario: string;
  side: Side;
  device: string;
  userdata: Userdata;
}): Promise<void> {
  log(`installing ${side} on ${device} and injecting ${scenario}`);
  await P.install(device, APPS[side]);
  await inject({ device, userdata, side }).catch(async (error: unknown) => {
    log(`  injection failed (${errorMessage(error)}); retrying once`);
    await P.stop(device);
    await inject({ device, userdata, side });
  });
}

async function measureScenario(scenario: string): Promise<void> {
  const userdata = await loadUserdata({
    dir: insideWorkingDir(opts["userdata-dir"]),
    names: scenario === "accounts" ? opts["accounts-userdata"] : opts["no-accounts-userdata"],
  });
  log(`=== ${scenario}: ${userdata.accounts.length} accounts from ${userdata.names.join(", ")}`);
  read = READ;
  for (const phase of [0, 1]) {
    // Never the same device twice in a row, warm-ups included.
    const { placement, order } = layout(phase);
    for (const side of order) {
      const device = placement[side];
      await installAndInject({ scenario, side, device, userdata });
      for (let w = 0; w < WARMUPS; w++) {
        // The last one reads only the log: on iOS a screen read would slow round 0.
        const lastWarmup = side === order.at(-1) && w === WARMUPS - 1;
        await sample(
          { scenario, phase, round: -1 - w, side, device, warmup: true },
          { checkScreen: !lastWarmup },
        );
      }
    }
    for (let round = 0; round < PAIRS / 2; round++) {
      for (const side of order) {
        await sample({ scenario, phase, round, side, device: placement[side], warmup: false });
      }
    }
  }
}

async function main(): Promise<void> {
  validateOptions();
  await mkdir(DEBUG_DIR, { recursive: true });
  await writeFile(SAMPLES_FILE, "");
  await writeMeta();
  for (const scenario of SCENARIOS) await measureScenario(scenario);
  for (const device of DEVICES) await P.stop(device);
  log(`done: ${SAMPLES_FILE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
