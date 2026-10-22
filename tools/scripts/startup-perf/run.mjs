#!/usr/bin/env node
// Measures LWM startup on two Android emulators or two iOS simulators, alternating build A and
// build B, and writes one JSON line per launch to <out-dir>/samples.jsonl.
//
// Each launch is a plain `adb shell am start` / `xcrun simctl launch` with no test tool attached.
// Maestro only opens Settings > Debug > Performance afterwards to read "App startup time".
// Accounts are injected once per install through the E2E bridge (bridge.mjs), then persisted by the app.
// Launches strictly alternate between the two devices, so every launch follows one on the other
// device: in run 39731729203 a launch right after one on the same simulator was ~270 ms faster.
// Halfway through each scenario the builds swap devices and the starting side flips, so a
// difference between the two devices cancels out of B − A (analyze.mjs reports it as "device bias").
// On Android the other emulator is paused from the launch until the read, so it takes no host CPU,
// and each sample records the CPU load on the host and in the device before and after the launch.
import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { startBridge } from "./bridge.mjs";

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
      default: "1AccountBTC1AccountETHReadOnlyFalse,speculos-x-other-account",
    },
    pairs: { type: "string", default: "20" },
    warmups: { type: "string", default: "1" },
    "idle-ms": { type: "string", default: "5000" },
    "settle-ms": { type: "string", default: "15000" },
    flow: { type: "string", default: path.join(import.meta.dirname, "read-performance.yaml") },
    maestro: { type: "string", default: "maestro" },
    "bridge-port": { type: "string", default: "8099" },
    "pause-idle": { type: "string", default: "true" },
    "out-dir": { type: "string", default: "startup-perf-results" },
  },
});

const PLATFORM = opts.platform;
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
const PAUSE_IDLE = opts["pause-idle"] === "true";
// The startup being measured ends within ~5 s of the launch command returning.
const LOAD_WINDOW_MS = 5000;
const OUT_DIR = opts["out-dir"];
const SAMPLES_FILE = path.join(OUT_DIR, "samples.jsonl");
const DEBUG_DIR = path.join(OUT_DIR, "debug");
// Per device: with strict alternation, a device that never reads would otherwise go unnoticed.
const MAX_CONSECUTIVE_FAILURES = 4;
// After a dialog's process is restarted, let the device settle before the next launch.
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

process.env.MAESTRO_CLI_NO_ANALYTICS = "1";
process.env.MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED = "true";

const log = message => console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function run(cmd, args, { timeoutMs = 120_000, allowFail = false } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const result = { failed: !!error, stdout: String(stdout), stderr: String(stderr) };
        if (error && !allowFail) {
          const detail = (result.stderr || result.stdout || error.message).slice(-1500);
          reject(new Error(`${cmd} ${args.join(" ")} failed: ${detail}`));
        } else {
          resolve(result);
        }
      },
    );
  });
}

const android = {
  components: new Map(),
  async install(device, apk) {
    await run("adb", ["-s", device, "uninstall", APP_ID], { allowFail: true });
    // -g grants runtime permissions up front, so no permission prompt covers the launch.
    // --no-incremental: an incremental install (picked when an .idsig sits next to the APK) skips
    // install-time dexopt on Android 16, which no user's install does.
    await run("adb", ["-s", device, "install", "--no-incremental", "-r", "-g", apk], {
      timeoutMs: 600_000,
    });
    this.components.delete(device);
  },
  async component(device) {
    if (!this.components.has(device)) {
      const { stdout } = await run("adb", [
        "-s",
        device,
        "shell",
        "cmd",
        "package",
        "resolve-activity",
        "--brief",
        "-c",
        "android.intent.category.LAUNCHER",
        APP_ID,
      ]);
      const component = stdout
        .split("\n")
        .map(l => l.trim())
        .reverse()
        .find(l => l.includes("/"));
      if (!component) throw new Error(`no launcher activity found for ${APP_ID}: ${stdout}`);
      this.components.set(device, component);
    }
    return this.components.get(device);
  },
  async stop(device) {
    for (const pkg of [APP_ID, "dev.mobile.maestro", "dev.mobile.maestro.test"]) {
      await run("adb", ["-s", device, "shell", "am", "force-stop", pkg], { allowFail: true });
    }
  },
  async launch(device, launchArgs) {
    const extras = Object.entries(launchArgs).flatMap(([k, v]) => ["--es", k, String(v)]);
    const component = await this.component(device);
    const { stdout } = await run("adb", [
      "-s",
      device,
      "shell",
      "am",
      "start",
      "-W",
      "-n",
      component,
      ...extras,
    ]);
    const field = name => stdout.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1]?.trim();
    const status = field("Status");
    // "timeout" is expected when the splash holds the first frame; the launch itself went through.
    if (status && !["ok", "timeout"].includes(status)) {
      throw new Error(`am start status ${status}: ${stdout}`);
    }
    const totalTime = Number(field("TotalTime"));
    const waitTime = Number(field("WaitTime"));
    return {
      amStart: {
        status: status ?? null,
        launchState: field("LaunchState") ?? null,
        totalTime: Number.isFinite(totalTime) ? totalTime : null,
        waitTime: Number.isFinite(waitTime) ? waitTime : null,
      },
    };
  },
  // Package named by a system dialog that has the focus ("System UI isn't responding", a crash
  // dialog), or null. It covers the app, so Maestro cannot read the screen.
  async blockingDialog(device) {
    const { stdout } = await run("adb", ["-s", device, "shell", "dumpsys", "window"], {
      allowFail: true,
    });
    return parseBlockingDialog(stdout);
  },
  // Emulators under load show these after boot. Restart the process, like
  // tools/scripts/wait_emulator_idle.sh does for the E2E emulators.
  async clearDialogs(device) {
    const cleared = [];
    let pkg = await this.blockingDialog(device);
    while (pkg && cleared.length < 5) {
      log(`  ${device}: dialog from ${pkg} on screen, restarting ${pkg}`);
      cleared.push(pkg);
      await run("adb", ["-s", device, "shell", "su", "0", "killall", pkg], { allowFail: true });
      if (pkg === "com.android.systemui") {
        await run(
          "adb",
          [
            "-s",
            device,
            "shell",
            "am",
            "start-service",
            "-n",
            "com.android.systemui/.SystemUIService",
          ],
          { allowFail: true },
        );
      }
      await sleep(5000);
      pkg = await this.blockingDialog(device);
    }
    return cleared;
  },
  // Freezes the emulator (console "avd stop"): its virtual CPUs stop, so it takes no host CPU while
  // the other one launches. adb commands sent to it wait until "avd start".
  async pause(device) {
    const { stdout } = await run("adb", ["-s", device, "emu", "avd", "stop"], {
      timeoutMs: 30_000,
    });
    if (!/^OK/m.test(stdout)) throw new Error(`avd stop on ${device}: ${stdout.trim()}`);
    return true;
  },
  async resume(device) {
    const { stdout } = await run("adb", ["-s", device, "emu", "avd", "start"], {
      timeoutMs: 30_000,
    });
    if (!/^OK/m.test(stdout)) throw new Error(`avd start on ${device}: ${stdout.trim()}`);
  },
  async cpuStat(device) {
    const { stdout, failed } = await run(
      "adb",
      ["-s", device, "shell", "cat", "/proc/loadavg", "/proc/stat"],
      { allowFail: true, timeoutMs: 20_000 },
    );
    return failed ? null : parseCpuStat(stdout);
  },
  async diagnostics(device, file) {
    const { stdout } = await run("adb", ["-s", device, "logcat", "-d", "-t", "3000"], {
      allowFail: true,
    });
    await writeFile(file, stdout);
  },
};

// /proc/loadavg followed by /proc/stat: 1-minute load average and the cumulative CPU time of all
// cores, in ticks. Steal is time the virtual CPUs were ready to run but the host ran something else.
export function parseCpuStat(text) {
  const cpu = text.match(/^cpu\s+(.+)$/m);
  if (!cpu) return null;
  const [user, nice, system, idle, iowait = 0, irq = 0, softirq = 0, steal = 0] = cpu[1]
    .trim()
    .split(/\s+/)
    .map(Number);
  const loadavg = text.match(/^(\d+\.\d+) \d+\.\d+ \d+\.\d+/m);
  return {
    loadavg1: loadavg ? Number(loadavg[1]) : null,
    busy: user + nice + system + irq + softirq,
    steal,
    total: user + nice + system + idle + iowait + irq + softirq + steal,
  };
}

export function parseBlockingDialog(dumpsysWindow) {
  return (
    dumpsysWindow.match(
      /mCurrentFocus=.*(?:Application Not Responding|Application Error): ([\w.]+)/,
    )?.[1] ?? null
  );
}

const ios = {
  async install(device, app) {
    await run("xcrun", ["simctl", "uninstall", device, APP_ID], { allowFail: true });
    await run("xcrun", ["simctl", "install", device, app], { timeoutMs: 600_000 });
  },
  async stop(device) {
    for (const bundleId of [APP_ID, "dev.mobile.maestro-driver-iosUITests.xctrunner"]) {
      await run("xcrun", ["simctl", "terminate", device, bundleId], { allowFail: true });
    }
  },
  async launch(device, launchArgs) {
    // react-native-launch-arguments reads "-key value" pairs from the process arguments.
    const args = Object.entries(launchArgs).flatMap(([k, v]) => [`-${k}`, String(v)]);
    await run("xcrun", ["simctl", "launch", device, APP_ID, ...args]);
    return {};
  },
  async blockingDialog() {
    return null;
  },
  async clearDialogs() {
    return [];
  },
  // Simulators are processes on the host: nothing to pause, and their load is the host's.
  async pause() {
    return false;
  },
  async resume() {},
  async cpuStat() {
    return null;
  },
  async diagnostics(device, file) {
    const { stdout } = await run(
      "xcrun",
      [
        "simctl",
        "spawn",
        device,
        "log",
        "show",
        "--last",
        "3m",
        "--style",
        "compact",
        "--predicate",
        'process == "ledgerlivemobile"',
      ],
      { allowFail: true, timeoutMs: 120_000 },
    );
    await writeFile(file, stdout);
  },
};

const P = PLATFORM === "android" ? android : ios;

// Flattens `maestro hierarchy` output into its visible strings, in screen order.
export function hierarchyTexts(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return [];
  let root;
  try {
    root = JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return [];
  }
  const texts = [];
  const visit = node => {
    const attributes = node?.attributes ?? {};
    for (const key of ["text", "accessibilityText", "hintText", "value"]) {
      const value = typeof attributes[key] === "string" ? attributes[key].trim() : "";
      if (value && texts[texts.length - 1] !== value) texts.push(value);
    }
    (node?.children ?? []).forEach(visit);
  };
  visit(root);
  return texts;
}

// Reads the Performance screen (src/screens/Settings/Debug/Performance): "App startup time"
// then one "<event> (xN)" row per startup event, each followed by "<time> ms".
export function parsePerformance(texts) {
  const joined = texts.join("\n");
  const label = "App startup time";
  const at = joined.indexOf(label);
  if (at < 0) return null;
  const after = joined.slice(at + label.length);
  const value = after.match(/(-?\d+)\s*ms\b/);
  if (!value || Number(value[1]) <= 0) return null;
  const events = {};
  for (const m of after.matchAll(/([^\n,]+?) \(x(\d+)\)\s*,?\s*(-?\d+)\s*ms\b/g)) {
    events[m[1].trim()] = { count: Number(m[2]), time: Number(m[3]) };
  }
  return { appStartupTime: Number(value[1]), events };
}

async function readPerformance(device, debugName) {
  let lastTexts = [];
  let lastFlow = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    lastFlow = await run(opts.maestro, ["--device", device, "test", opts.flow], {
      timeoutMs: 240_000,
      allowFail: true,
    });
    for (let i = 0; i < 3; i++) {
      const hierarchy = await run(opts.maestro, ["--device", device, "hierarchy"], {
        timeoutMs: 120_000,
        allowFail: true,
      });
      lastTexts = hierarchyTexts(hierarchy.stdout);
      const parsed = parsePerformance(lastTexts);
      if (parsed) return parsed;
      await sleep(2000);
    }
    // A second attempt cannot get past a system dialog; the launch is not trusted either.
    const dialog = await P.blockingDialog(device);
    if (dialog) {
      lastTexts.unshift(`(dialog from ${dialog} has the focus)`);
      break;
    }
  }
  await writeFile(
    path.join(DEBUG_DIR, `${debugName}.txt`),
    `--- maestro test stdout\n${lastFlow?.stdout}\n--- stderr\n${lastFlow?.stderr}\n--- screen texts\n${lastTexts.join("\n")}\n`,
  );
  throw new Error("could not read App startup time from the Performance screen");
}

async function loadUserdata(names) {
  const files = names
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  let settings = {};
  let postOnboarding;
  const accounts = [];
  const seen = new Set();
  for (const [index, name] of files.entries()) {
    const { data } = JSON.parse(
      await readFile(path.join(opts["userdata-dir"], `${name}.json`), "utf8"),
    );
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
  // Same defaults as loadConfig in e2e/mobile/bridge/server.ts. Feature-flag overrides and
  // trustchains in the userdata are deliberately not imported: flags must come from production Firebase.
  return {
    names: files,
    settings: { shareAnalytics: false, hasSeenAnalyticsOptInPrompt: true, ...settings },
    accounts,
    postOnboarding,
  };
}

async function inject(device, userdata) {
  const bridge = startBridge(BRIDGE_PORT, m => log(`  [bridge] ${m}`));
  await bridge.listening;
  try {
    // Only the app being injected may connect: both devices reach the bridge on the same host port.
    for (const d of DEVICES) await P.stop(d);
    await P.clearDialogs(device);
    await P.launch(device, { mock: "0", wsPort: BRIDGE_PORT, wsToken: "startup-perf" });
    await bridge.waitForClient(180_000);
    // Let the client finish its handshake before the first message.
    await sleep(2000);
    bridge.send("acceptTerms");
    bridge.send("importSettings", userdata.settings);
    bridge.send("navigate", "Base");
    if (userdata.accounts.length) bridge.send("importAccounts", userdata.accounts);
    if (userdata.postOnboarding) bridge.send("importPostOnboarding", userdata.postOnboarding);
    // Accounts are saved as soon as they are imported. Settings are only saved by the store's
    // save effect, which may not be mounted yet on a fresh install: send them again once it is.
    await sleep(10_000);
    bridge.send("acceptTerms");
    bridge.send("importSettings", { ...userdata.settings });
    await sleep(10_000);
    await P.stop(device);
  } finally {
    await bridge.close();
  }
}

// Cumulative CPU time of the runner (all its cores, whoever uses them), in ms.
function hostCpuTimes() {
  let busy = 0;
  let total = 0;
  for (const { times } of os.cpus()) {
    busy += times.user + times.nice + times.sys + times.irq;
    total += times.user + times.nice + times.sys + times.irq + times.idle;
  }
  return { busy, total };
}

// Time this job's cgroup was held back by its CPU quota, in µs; null on a VM or without a quota.
async function cgroupThrottledUs() {
  const sources = [
    ["/sys/fs/cgroup/cpu.stat", "throttled_usec", 1],
    ["/sys/fs/cgroup/cpu/cpu.stat", "throttled_time", 1e-3],
  ];
  for (const [file, key, toUs] of sources) {
    const text = await readFile(file, "utf8").catch(() => "");
    const value = text.match(new RegExp(`^${key} (\\d+)$`, "m"))?.[1];
    if (value) return Number(value) * toUs;
  }
  return null;
}

async function loadSnapshot(device) {
  return {
    at: Date.now(),
    host: hostCpuTimes(),
    throttledUs: await cgroupThrottledUs(),
    device: await P.cpuStat(device),
  };
}

const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

export function loadBetween(a, b) {
  const load = {
    ms: b.at - a.at,
    hostBusyPct: percent(b.host.busy - a.host.busy, b.host.total - a.host.total),
    hostLoadavg1: Math.round(os.loadavg()[0] * 100) / 100,
  };
  if (a.throttledUs !== null && b.throttledUs !== null) {
    load.throttledMs = Math.round((b.throttledUs - a.throttledUs) / 1000);
  }
  if (a.device && b.device) {
    const total = b.device.total - a.device.total;
    load.deviceBusyPct = percent(b.device.busy - a.device.busy, total);
    load.deviceStealPct = percent(b.device.steal - a.device.steal, total);
    load.deviceLoadavg1 = b.device.loadavg1;
  }
  return load;
}

const consecutiveFailures = new Map();
let lastLaunchDevice = null;

async function sample(meta) {
  const record = {
    platform: PLATFORM,
    ...meta,
    afterSameDevice: lastLaunchDevice === meta.device,
    startedAt: new Date().toISOString(),
    ok: false,
  };
  const name = `${meta.scenario}-p${meta.phase}-r${meta.round}-${meta.side}`;
  const other = DEVICES.find(d => d !== meta.device);
  let paused = false;
  try {
    // Stop the app on both devices so the idle one is not syncing in the background.
    for (const device of DEVICES) await P.stop(device);
    const dialogs = [];
    for (const device of DEVICES) dialogs.push(...(await P.clearDialogs(device)));
    if (dialogs.length) {
      record.clearedDialogs = dialogs;
      await sleep(DIALOG_RECOVERY_MS);
    }
    const idleStart = await loadSnapshot(meta.device);
    await sleep(IDLE_MS);
    const idleEnd = await loadSnapshot(meta.device);
    if (PAUSE_IDLE) {
      paused = await P.pause(other).catch(error => {
        log(`  could not pause ${other}, launching with it running: ${error.message}`);
        return false;
      });
    }
    lastLaunchDevice = meta.device;
    // Host only: reading the device here would add work right before the launch.
    const launchStart = {
      ...idleEnd,
      at: Date.now(),
      host: hostCpuTimes(),
      throttledUs: await cgroupThrottledUs(),
    };
    const launch = await P.launch(meta.device, { mock: "0" });
    await sleep(Math.min(LOAD_WINDOW_MS, SETTLE_MS));
    const launchEnd = await loadSnapshot(meta.device);
    record.load = {
      otherPaused: paused,
      beforeLaunch: loadBetween(idleStart, idleEnd),
      duringLaunch: loadBetween(launchStart, launchEnd),
    };
    await sleep(Math.max(0, SETTLE_MS - LOAD_WINDOW_MS));
    if (paused) {
      paused = false;
      await P.resume(other);
    }
    const perf = await readPerformance(meta.device, name);
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
  await appendFile(SAMPLES_FILE, JSON.stringify(record) + "\n");
  const what = record.ok
    ? `${record.appStartupTime} ms${record.amStart?.totalTime ? ` (am start ${record.amStart.totalTime} ms)` : ""}`
    : `FAILED: ${record.error.split("\n")[0]}`;
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
        pauseIdle: PAUSE_IDLE && PLATFORM === "android",
        hostCpus: os.cpus().length,
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
    const userdata = await loadUserdata(
      scenario === "accounts" ? opts["accounts-userdata"] : opts["no-accounts-userdata"],
    );
    log(`=== ${scenario}: ${userdata.accounts.length} accounts from ${userdata.names.join(", ")}`);
    for (const phase of [0, 1]) {
      const placement =
        phase === 0 ? { A: DEVICES[0], B: DEVICES[1] } : { A: DEVICES[1], B: DEVICES[0] };
      // A B A B … in the first half, B A B A … after the swap: never the same device twice in a row.
      // Warm-ups use the same order, so the last one is on the other device from the first launch.
      const order = phase === 0 ? ["A", "B"] : ["B", "A"];
      for (const side of order) {
        const device = placement[side];
        log(`installing ${side} on ${device} and injecting ${scenario}`);
        await P.install(device, APPS[side]);
        await inject(device, userdata);
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
