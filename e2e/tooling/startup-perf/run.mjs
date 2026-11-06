#!/usr/bin/env node
// Writes one JSON line per launch to <out-dir>/samples.jsonl. See README.md.
import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
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
const OUT_DIR = opts["out-dir"];
const SAMPLES_FILE = path.join(OUT_DIR, "samples.jsonl");
const DEBUG_DIR = path.join(OUT_DIR, "debug");
const FULL_FLOW = path.join(import.meta.dirname, "flows", "read-performance.yaml");
const QUICK_FLOW = path.join(import.meta.dirname, "flows", "read-performance-quick.yaml");
const SCROLL_FLOW = path.join(import.meta.dirname, "flows", "scroll-performance.yaml");
const SCROLL_TO_END_FLOW = path.join(
  import.meta.dirname,
  "flows",
  "scroll-performance-to-end.yaml",
);
// "App startup time" is the later of these two: a read before both exist under-reports it.
const FINAL_EVENTS = ["App started", "Splash screen faded"];
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

const MAESTRO_ENV = Object.fromEntries(
  Object.entries({
    ...process.env,
    MAESTRO_DISABLE_UPDATE_CHECK: "true",
    MAESTRO_CLI_NO_ANALYTICS: "1",
    MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
  }).filter(([key]) => PLATFORM !== "ios" || !(key === "ANDROID" || key.startsWith("ANDROID_"))),
);
// One per simulator, so the calls of a read reuse one driver.
const IOS_DRIVER_PORT = 22087;
let maestroCalls = [];

async function maestro(device, command, args, { timeoutMs }) {
  const port = PLATFORM === "ios" ? IOS_DRIVER_PORT + DEVICES.indexOf(device) : null;
  const startedAt = Date.now();
  const result = await run(
    opts.maestro,
    [
      ...(port === null ? [] : ["--driver-host-port", String(port)]),
      "--device",
      device,
      command,
      "--no-reinstall-driver",
      ...args,
    ],
    { timeoutMs, allowFail: true, env: MAESTRO_ENV },
  );
  maestroCalls.push({
    command,
    flow: args[0] ? path.basename(args[0]) : null,
    ms: Date.now() - startedAt,
    ...(result.failed ? { error: `${result.stdout}\n${result.stderr}`.trim().slice(-400) } : {}),
  });
  return result;
}

const log = message => console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function run(cmd, args, { timeoutMs = 120_000, allowFail = false, env } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, ...(env ? { env } : {}) },
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
    // --no-incremental: an incremental install skips install-time dexopt on Android 16.
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
    await run("adb", ["-s", device, "shell", "am", "force-stop", APP_ID], { allowFail: true });
    await this.stopDriver(device);
  },
  async stopDriver(device) {
    for (const pkg of ["dev.mobile.maestro", "dev.mobile.maestro.test"]) {
      await run("adb", ["-s", device, "shell", "am", "force-stop", pkg], { allowFail: true });
    }
  },
  async launch(device, launchArgs = {}) {
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
    return { amStartMs: Number.isFinite(totalTime) ? totalTime : null };
  },
  async ensureScreenOn(device) {
    const read = async () => {
      const { stdout } = await run(
        "adb",
        [
          "-s",
          device,
          "shell",
          "dumpsys power | grep -m1 mWakefulness=; dumpsys window | grep -m1 mCurrentFocus=",
        ],
        { allowFail: true, timeoutMs: 20_000 },
      );
      return parseScreenState(stdout);
    };
    const before = await read();
    if (before.wakefulness === "Awake" && !before.keyguard) return before;
    log(
      `  ${device}: screen ${before.wakefulness ?? "unknown"}, focus ${before.focus ?? "unknown"}; waking it`,
    );
    await run(
      "adb",
      ["-s", device, "shell", "input keyevent KEYCODE_WAKEUP; wm dismiss-keyguard"],
      {
        allowFail: true,
      },
    );
    await sleep(1000);
    return { ...(await read()), wokenFrom: before };
  },
  async blockingDialog(device) {
    const { stdout } = await run("adb", ["-s", device, "shell", "dumpsys", "window"], {
      allowFail: true,
    });
    return parseBlockingDialog(stdout);
  },
  // Like tools/scripts/wait_emulator_idle.sh for the E2E emulators.
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
  // Freezes the emulator's vCPUs; adb commands sent to it wait until "avd start".
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
  // On the runner's clock and on the emulator's, which the app's Date.now() uses.
  async processStart(device) {
    const before = Date.now();
    const { stdout, failed } = await run(
      "adb",
      [
        "-s",
        device,
        "shell",
        `echo "epoch \${EPOCHREALTIME:-$(date +%s.%N)}"; cat /proc/uptime; cat /proc/$(pidof -s ${APP_ID})/stat`,
      ],
      { allowFail: true, timeoutMs: 20_000 },
    );
    const after = Date.now();
    if (failed) return null;
    const at = parseProcessStart(stdout, (before + after) / 2);
    const guestEpoch = Number(stdout.match(/^epoch (\d+\.\d+)/m)?.[1]) * 1000;
    const appClockAt = Number.isFinite(guestEpoch) ? parseProcessStart(stdout, guestEpoch) : null;
    return at === null ? null : { at, appClockAt, pid: parseStatPid(stdout) };
  },
  async pid(device) {
    const { stdout, failed } = await run("adb", ["-s", device, "shell", "pidof", "-s", APP_ID], {
      allowFail: true,
      timeoutMs: 20_000,
    });
    const pid = Number(stdout.trim());
    return failed || !Number.isInteger(pid) || pid <= 0 ? null : pid;
  },
  screenSizes: new Map(),
  async scrollDown(device, { fling = false } = {}) {
    if (!this.screenSizes.has(device)) {
      const { stdout } = await run("adb", ["-s", device, "shell", "wm", "size"], {
        allowFail: true,
      });
      const sizes = [...stdout.matchAll(/(\d+)x(\d+)/g)].map(m => [Number(m[1]), Number(m[2])]);
      this.screenSizes.set(device, sizes.at(-1) ?? [1080, 2400]);
    }
    const [width, height] = this.screenSizes.get(device);
    const x = String(Math.round(width / 2));
    if (fling) {
      const from = String(Math.round(height * 0.85));
      const to = String(Math.round(height * 0.15));
      for (let i = 0; i < 3; i++) {
        await run("adb", ["-s", device, "shell", "input", "swipe", x, from, x, to, "80"], {
          allowFail: true,
        });
      }
      await sleep(1500);
      return;
    }
    const from = String(Math.round(height * 0.75));
    const to = String(Math.round(height * 0.3));
    await run("adb", ["-s", device, "shell", "input", "swipe", x, from, x, to, "600"], {
      allowFail: true,
    });
    await sleep(800);
  },
  async scrollToEnd(device) {
    await this.scrollDown(device, { fling: true });
  },
  async diagnostics(device, file) {
    const { stdout } = await run("adb", ["-s", device, "logcat", "-d", "-t", "3000"], {
      allowFail: true,
    });
    await writeFile(file, stdout);
  },
};

// Field 22 of /proc/<pid>/stat is the process start in clock ticks since boot (USER_HZ = 100).
export function parseProcessStart(text, readAt) {
  const uptime = Number(text.match(/^(\d+\.\d+) /m)?.[1]);
  const stat = text.slice(text.lastIndexOf(")") + 2).split(" ");
  const startTicks = Number(stat[19]);
  if (!Number.isFinite(uptime) || !Number.isFinite(startTicks)) return null;
  return Math.round(readAt - (uptime - startTicks / 100) * 1000);
}

export function parseStatPid(text) {
  const pid = Number(text.match(/^(\d+) \(/m)?.[1]);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

export function parseScreenState(text) {
  const focus = text.match(/mCurrentFocus=Window\{\S+ \S+ ([^}]+)\}/)?.[1]?.trim() ?? null;
  return {
    wakefulness: text.match(/mWakefulness=(\w+)/)?.[1] ?? null,
    focus,
    keyguard: /NotificationShade|Keyguard/i.test(focus ?? ""),
  };
}

export function parseBlockingDialog(dumpsysWindow) {
  return (
    dumpsysWindow.match(
      /mCurrentFocus=.*(?:Application Not Responding|Application Error): ([\w.]+)/,
    )?.[1] ?? null
  );
}

// sysctl KERN_PROC_PID: kinfo_proc opens with p_starttime, a timeval.
const PROCESS_START_PY = `
import ctypes, sys
libc = ctypes.CDLL("/usr/lib/libc.dylib")
mib = (ctypes.c_int * 4)(1, 14, 1, int(sys.argv[1]))
size = ctypes.c_size_t(0)
if libc.sysctl(mib, 4, None, ctypes.byref(size), None, 0) != 0 or size.value < 16:
    sys.exit(1)
buf = ctypes.create_string_buffer(size.value)
if libc.sysctl(mib, 4, buf, ctypes.byref(size), None, 0) != 0 or size.value < 16:
    sys.exit(1)
sec = int.from_bytes(buf.raw[0:8], "little", signed=True)
usec = int.from_bytes(buf.raw[8:12], "little", signed=True)
print(sec * 1000 + usec / 1000)
`;

const ios = {
  async install(device, app) {
    await run("xcrun", ["simctl", "uninstall", device, APP_ID], { allowFail: true });
    await run("xcrun", ["simctl", "install", device, app], { timeoutMs: 600_000 });
  },
  async stop(device) {
    await run("xcrun", ["simctl", "terminate", device, APP_ID], { allowFail: true });
    await this.stopDriver(device);
  },
  // Maestro's xcodebuild driver outlives the call that started it.
  async stopDriver(device) {
    const xcodebuild = `test-without-building.*id=${device}`;
    await run("pkill", ["-f", xcodebuild], { allowFail: true });
    for (let i = 0; i < 30; i++) {
      if ((await run("pgrep", ["-f", xcodebuild], { allowFail: true })).failed) break;
      await sleep(500);
    }
    await run(
      "xcrun",
      ["simctl", "terminate", device, "dev.mobile.maestro-driver-iosUITests.xctrunner"],
      {
        allowFail: true,
      },
    );
  },
  pids: new Map(),
  async launch(device, launchArgs = {}) {
    // react-native-launch-arguments reads "-key value" pairs from the process arguments.
    const args = Object.entries(launchArgs).flatMap(([k, v]) => [`-${k}`, String(v)]);
    const { stdout } = await run("xcrun", ["simctl", "launch", device, APP_ID, ...args]);
    const pid = Number(stdout.match(/:\s*(\d+)\s*$/m)?.[1]);
    this.pids.set(device, Number.isInteger(pid) && pid > 0 ? pid : null);
    return {};
  },
  async processStart(device) {
    const pid = this.pids.get(device);
    if (!pid) return null;
    const { stdout, failed } = await run("python3", ["-c", PROCESS_START_PY, String(pid)], {
      allowFail: true,
      timeoutMs: 20_000,
    });
    const at = Number(stdout.trim());
    return failed || !Number.isFinite(at) ? null : { at, appClockAt: at, pid };
  },
  async pid(device) {
    const pid = this.pids.get(device);
    if (!pid) return null;
    return (await run("kill", ["-0", String(pid)], { allowFail: true })).failed ? null : pid;
  },
  async blockingDialog() {
    return null;
  },
  async clearDialogs() {
    return [];
  },
  async ensureScreenOn() {
    return null;
  },
  async pause() {
    return false;
  },
  async resume() {},
  async scrollDown(device) {
    await maestro(device, "test", [SCROLL_FLOW], { timeoutMs: 60_000 });
  },
  async scrollToEnd(device) {
    await maestro(device, "test", [SCROLL_TO_END_FLOW], { timeoutMs: 60_000 });
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

export function parsePerformance(texts) {
  const joined = texts.join("\n");
  const label = "App startup time";
  const at = joined.indexOf(label);
  if (at < 0) return null;
  const after = joined.slice(at + label.length);
  const value = after.match(/(-?\d+)\s*ms\b/);
  if (!value || Number(value[1]) <= 0) return null;
  return { appStartupTime: Number(value[1]), events: parseEvents(texts) };
}

export function parseEvents(texts) {
  const events = {};
  for (const m of texts.join("\n").matchAll(/([^\n,]+?) \(x(\d+)\)\s*,?\s*(-?\d+)\s*ms\b/g)) {
    events[m[1].trim()] = { count: Number(m[2]), time: Number(m[3]) };
  }
  return events;
}

const MAX_SCROLLS = 10;

async function readHierarchyEvents(device) {
  const hierarchy = await maestro(device, "hierarchy", [], { timeoutMs: 60_000 });
  return parseEvents(hierarchyTexts(hierarchy.stdout));
}

async function readAllEvents(device, events) {
  const all = { ...events };
  for (let i = 0; i < MAX_SCROLLS; i++) {
    await P.scrollDown(device);
    const found = Object.entries(await readHierarchyEvents(device)).filter(
      ([name]) => !(name in all),
    );
    if (!found.length) break;
    for (const [name, event] of found) all[name] = event;
  }
  return all;
}

async function readRemainingEvents(device, events) {
  await P.scrollToEnd(device);
  const all = { ...events, ...(await readHierarchyEvents(device)) };
  return FINAL_EVENTS.every(name => name in all) ? all : readAllEvents(device, all);
}

async function readPerformance(device, debugName, { quick }) {
  let lastTexts = [];
  let lastFlow = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const flow = quick && attempt === 1 ? QUICK_FLOW : FULL_FLOW;
    // A driver stuck on an abandoned call would otherwise serve the retry too.
    if (attempt === 2) await P.stopDriver(device);
    lastFlow = await maestro(device, "test", [flow], { timeoutMs: 120_000 });
    for (let i = 0; i < 3; i++) {
      const hierarchy = await maestro(device, "hierarchy", [], { timeoutMs: 60_000 });
      lastTexts = hierarchyTexts(hierarchy.stdout);
      const parsed = parsePerformance(lastTexts);
      if (parsed) {
        const events = await readRemainingEvents(device, parsed.events);
        const missing = FINAL_EVENTS.filter(name => !(name in events));
        if (missing.length) {
          throw new Error(
            `${missing.join(" and ")} not logged when the screen opened: App startup time would be under-reported`,
          );
        }
        return { ...parsed, events };
      }
      await sleep(2000);
    }
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
  // Defaults of loadConfig in e2e/mobile/bridge/server.ts; no feature flags: production Firebase's.
  return {
    names: files,
    settings: { shareAnalytics: false, hasSeenAnalyticsOptInPrompt: true, ...settings },
    accounts,
    postOnboarding,
  };
}

async function inject(device, userdata, side) {
  const bridge = startBridge(BRIDGE_PORT, m => log(`  [bridge] ${m}`));
  await bridge.listening;
  const sent = [];
  const send = (type, payload) => sent.push({ type, id: bridge.send(type, payload) });
  const acknowledged = async () => {
    for (const { type, id } of sent.splice(0)) {
      await bridge.waitFor(id, "ACK", 60_000).catch(() => {
        throw new Error(`injection on ${device}: the app did not acknowledge ${type}`);
      });
    }
  };
  try {
    // Both devices reach the bridge on the same host port.
    for (const d of DEVICES) await P.stop(d);
    await P.clearDialogs(device);
    await P.launch(device, { wsPort: BRIDGE_PORT, wsToken: "startup-perf" });
    await bridge.waitForClient(180_000);
    await sleep(2000);
    send("acceptTerms");
    send("importSettings", userdata.settings);
    send("navigate", "Base");
    if (userdata.accounts.length) send("importAccounts", userdata.accounts);
    if (userdata.postOnboarding) send("importPostOnboarding", userdata.postOnboarding);
    await acknowledged();
    // Settings are saved only once the store's save effect is mounted: send them again.
    await sleep(10_000);
    send("acceptTerms");
    send("importSettings", { ...userdata.settings });
    await acknowledged();
    await checkTestModes(bridge, device, side);
    await sleep(10_000);
    await P.stop(device);
  } finally {
    await bridge.close();
  }
}

async function checkTestModes(bridge, device, side) {
  let envs = null;
  try {
    // Builds before mid-September 2026 reply without the message id.
    const from = bridge.received.length;
    const id = bridge.send("getEnvs");
    await bridge.waitFor(id, "ACK", 15_000);
    const reply = bridge.received
      .slice(from)
      .find(m => m.type === "appEnvs" && (m.id === id || m.id === undefined));
    envs = reply ? JSON.parse(reply.payload) : null;
  } catch {}
  if (!envs) throw new Error(`build ${side}: MOCK and DETOX could not be read`);
  const on = name => Boolean(envs[name]) && envs[name] !== "0";
  log(
    `  ${device}: build ${side} runs with MOCK ${on("MOCK") ? "on" : "off"}, DETOX ${on("DETOX") ? "on" : "off"}`,
  );
  if (on("MOCK") || on("DETOX")) throw new Error(`build ${side} runs with MOCK or DETOX on`);
}

const consecutiveFailures = new Map();

async function sample(meta) {
  const record = {
    platform: PLATFORM,
    ...meta,
    startedAt: new Date().toISOString(),
    ok: false,
  };
  const name = `${meta.scenario}-p${meta.phase}-r${meta.round}-${meta.side}`;
  const other = DEVICES.find(d => d !== meta.device);
  maestroCalls = [];
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
    const perf = await readPerformance(meta.device, name, { quick: !meta.warmup });
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
  record.maestroCalls = maestroCalls;
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
    const userdata = await loadUserdata(
      scenario === "accounts" ? opts["accounts-userdata"] : opts["no-accounts-userdata"],
    );
    log(`=== ${scenario}: ${userdata.accounts.length} accounts from ${userdata.names.join(", ")}`);
    for (const phase of [0, 1]) {
      const placement =
        phase === 0 ? { A: DEVICES[0], B: DEVICES[1] } : { A: DEVICES[1], B: DEVICES[0] };
      // Never the same device twice in a row, warm-ups included.
      const order = phase === 0 ? ["A", "B"] : ["B", "A"];
      for (const side of order) {
        const device = placement[side];
        log(`installing ${side} on ${device} and injecting ${scenario}`);
        await P.install(device, APPS[side]);
        await inject(device, userdata, side).catch(async error => {
          log(`  injection failed (${error.message}); retrying once`);
          await P.stop(device);
          await inject(device, userdata, side);
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
