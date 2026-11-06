#!/usr/bin/env node
// Writes one JSON line per launch to <out-dir>/samples.jsonl. See README.md.
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createAndroid } from "./platforms/android.mjs";
import { log, sleep } from "./exec.mjs";
import { createInjector, loadUserdata } from "./inject.mjs";
import { createIos } from "./platforms/ios.mjs";
import { createMaestro } from "./maestro.mjs";
import { createPerformanceReader } from "./performance-screen.mjs";

/** @import { Sample, SampleMeta } from "./types.mjs" */

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
    maestro: { type: "string", default: "maestro" },
    "bridge-port": { type: "string", default: "8099" },
    "out-dir": { type: "string", default: "startup-perf-results" },
  },
});

const PLATFORM = /** @type {"android" | "ios"} */ (opts.platform);
const DEVICES = (opts.devices ?? "").split(",").filter(Boolean);
const APPS = { A: opts["app-a"], B: opts["app-b"] };
const APP_ID = opts["app-id"];
const SCENARIOS = opts.scenarios
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const PAIRS = Number(opts.pairs);
const WARMUPS = Number(opts.warmups);
const IDLE_MS = Number(opts["idle-ms"]);
const SETTLE_MS = Number(opts["settle-ms"]);
const BRIDGE_PORT = Number(opts["bridge-port"]);
const OUT_DIR = opts["out-dir"];
const SAMPLES_FILE = path.join(OUT_DIR, "samples.jsonl");
const DEBUG_DIR = path.join(OUT_DIR, "debug");
const MAX_CONSECUTIVE_FAILURES = 4;
const DIALOG_RECOVERY_MS = 30_000;

function validateOptions() {
  if (!["android", "ios"].includes(PLATFORM)) throw new Error("--platform must be android or ios");
  if (DEVICES.length !== 2) throw new Error("--devices needs exactly two ids, comma-separated");
  if (!APPS.A || !APPS.B) {
    throw new Error("--app-a and --app-b are required (pass the same path twice for A/A)");
  }
  if (!Number.isInteger(PAIRS) || PAIRS < 2 || PAIRS % 2) {
    throw new Error("--pairs must be an even number ≥ 2");
  }
  for (const s of SCENARIOS) {
    if (!["no-accounts", "accounts"].includes(s)) throw new Error(`unknown scenario ${s}`);
  }
}

const maestro = createMaestro({ binary: opts.maestro, platform: PLATFORM, devices: DEVICES });
const P =
  PLATFORM === "android" ? createAndroid({ appId: APP_ID }) : createIos({ appId: APP_ID, maestro });
const readPerformance = createPerformanceReader({ platform: P, maestro });
const inject = createInjector({ platform: P, devices: DEVICES, port: BRIDGE_PORT });

const consecutiveFailures = new Map();

/** @param {SampleMeta} meta */
async function sample(meta) {
  /** @type {Sample} */
  const record = {
    platform: PLATFORM,
    ...meta,
    startedAt: new Date().toISOString(),
    ok: false,
  };
  const name = `${meta.scenario}-p${meta.phase}-r${meta.round}-${meta.side}`;
  const other = DEVICES.find(d => d !== meta.device);
  maestro.calls = [];
  let readStart = null;
  let paused = false;
  try {
    for (const device of DEVICES) await P.stop(device);
    const dialogs = [];
    for (const device of DEVICES) dialogs.push(...(await P.clearDialogs(device)));
    if (dialogs.length) {
      record.clearedDialogs = dialogs;
      await sleep(DIALOG_RECOVERY_MS);
    }
    record.screen = await P.ensureScreenOn(meta.device);
    await sleep(IDLE_MS);
    paused = await P.pause(other).catch(error => {
      log(`  could not pause ${other}, launching with it running: ${error.message}`);
      return false;
    });
    record.otherPaused = paused;
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
    const perf = await readPerformance(meta.device, {
      quick: !meta.warmup,
      debugFile: path.join(DEBUG_DIR, `${name}.txt`),
    });
    const pidAtRead = await P.pid(meta.device);
    if (pidAtRead !== record.pid) {
      throw new Error(`the app process changed before the read (pid ${record.pid} → ${pidAtRead})`);
    }
    Object.assign(record, launch, perf, { ok: true });
    consecutiveFailures.set(meta.device, 0);
  } catch (error) {
    record.error = String(error?.message ?? error).slice(0, 1500);
    consecutiveFailures.set(meta.device, (consecutiveFailures.get(meta.device) ?? 0) + 1);
    await P.diagnostics(meta.device, path.join(DEBUG_DIR, `${name}.log`)).catch(() => {});
  } finally {
    // A device left paused would hang every later adb command sent to it.
    if (paused) await P.resume(other);
  }
  if (readStart !== null) record.readMs = Date.now() - readStart;
  record.maestroCalls = maestro.calls;
  await appendFile(SAMPLES_FILE, JSON.stringify(record) + "\n");
  const what = record.ok ? `${record.appStartupTime} ms` : `FAILED: ${record.error.split("\n")[0]}`;
  log(`${meta.warmup ? "warm-up " : ""}${name} on ${meta.device}: ${what}`);
  if (consecutiveFailures.get(meta.device) >= MAX_CONSECUTIVE_FAILURES) {
    throw new Error(
      `${MAX_CONSECUTIVE_FAILURES} launches in a row failed on ${meta.device}; stopping (see ${DEBUG_DIR})`,
    );
  }
  return record;
}

async function main() {
  validateOptions();
  await mkdir(DEBUG_DIR, { recursive: true });
  await writeFile(SAMPLES_FILE, "");
  await writeFile(
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
        userdata: {
          "no-accounts": opts["no-accounts-userdata"],
          accounts: opts["accounts-userdata"],
        },
      },
      null,
      2,
    ),
  );

  for (const scenario of SCENARIOS) {
    const userdata = await loadUserdata({
      dir: opts["userdata-dir"],
      names: scenario === "accounts" ? opts["accounts-userdata"] : opts["no-accounts-userdata"],
    });
    log(`=== ${scenario}: ${userdata.accounts.length} accounts from ${userdata.names.join(", ")}`);
    for (const phase of [0, 1]) {
      const placement =
        phase === 0 ? { A: DEVICES[0], B: DEVICES[1] } : { A: DEVICES[1], B: DEVICES[0] };
      // Never the same device twice in a row, warm-ups included.
      /** @type {Array<"A" | "B">} */
      const order = phase === 0 ? ["A", "B"] : ["B", "A"];
      for (const side of order) {
        const device = placement[side];
        log(`installing ${side} on ${device} and injecting ${scenario}`);
        await P.install(device, APPS[side]);
        await inject({ device, userdata, side }).catch(async error => {
          log(`  injection failed (${error.message}); retrying once`);
          await P.stop(device);
          await inject({ device, userdata, side });
        });
        for (let w = 0; w < WARMUPS; w++) {
          await sample({ scenario, phase, round: -1 - w, side, device, warmup: true });
        }
      }
      for (let round = 0; round < PAIRS / 2; round++) {
        for (const side of order) {
          await sample({ scenario, phase, round, side, device: placement[side], warmup: false });
        }
      }
    }
  }
  for (const device of DEVICES) await P.stop(device);
  log(`done: ${SAMPLES_FILE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
