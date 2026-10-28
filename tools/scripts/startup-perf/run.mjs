#!/usr/bin/env node
// Measures LWM startup on two Android emulators or two iOS simulators, alternating build A and
// build B, and writes one JSON line per launch to <out-dir>/samples.jsonl.
//
// Each launch is a plain `adb shell am start` / `xcrun simctl launch` with no test tool attached.
// Maestro only opens Settings > Debug > Performance afterwards to read "App startup time", then the
// last rows (or, with --all-events, every row).
// Accounts are injected once per install through the E2E bridge (bridge.mjs), then persisted by the app.
// Launches strictly alternate between the two devices, so every launch follows one on the other
// device: in run 39731729203 a launch right after one on the same simulator was ~270 ms faster.
// Halfway through each scenario the builds swap devices and the starting side flips, so a
// difference between the two devices cancels out of B − A (analyze.mjs reports it as "device bias").
// On Android the other emulator is paused from the launch until the read, so it takes no host CPU,
// and each sample records the CPU load on the host and in the device before and after the launch.
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, copyFile, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { startBridge } from "./bridge.mjs";

const DEFAULT_FLOW = path.join(import.meta.dirname, "read-performance.yaml");

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
    "idle-ms": { type: "string", default: "2000" },
    "settle-ms": { type: "string", default: "5000" },
    // Read every startup event row; by default only the first screen and the last rows are read.
    "all-events": { type: "boolean", default: false },
    flow: { type: "string", default: DEFAULT_FLOW },
    maestro: { type: "string", default: "maestro" },
    "bridge-port": { type: "string", default: "8099" },
    "pause-idle": { type: "string", default: "true" },
    // Comma-separated URLs timed with curl from the runner before each launch: the network
    // without the emulator, to compare with the same requests made by the app.
    "net-baseline": { type: "string", default: "" },
    // Android: capture each launch's packets inside the emulator too (console "network capture").
    // It only covers the cellular interface, so it is for emulators with Wi-Fi turned off.
    "guest-capture": { type: "string", default: "false" },
    // Android: record a Perfetto trace of N measured launches per scenario: whole rounds (both
    // sides), spread over both phases, so N is rounded up to a multiple of 4. Tracing adds load, so
    // these samples are flagged `traced` and left out of the analysis.
    "trace-launches": { type: "string", default: "0" },
    // Diagnostics: dump the home screen's view hierarchy (testIDs on screen) ~5 s after the first N
    // measured launches of each scenario, after the launch window.
    "dump-home": { type: "string", default: "0" },
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
const GUEST_CAPTURE = opts["guest-capture"] === "true";
const TRACE_LAUNCHES = Number(opts["trace-launches"]);
const DUMP_HOME = Number(opts["dump-home"]);
const NET_BASELINE = opts["net-baseline"]
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
// The startup being measured ends within ~5 s of the launch command returning.
const LOAD_WINDOW_MS = 5000;
const OUT_DIR = opts["out-dir"];
const SAMPLES_FILE = path.join(OUT_DIR, "samples.jsonl");
const DEBUG_DIR = path.join(OUT_DIR, "debug");
const GUEST_PCAP_DIR = path.join(OUT_DIR, "guest-network");
const TRACE_DIR = path.join(OUT_DIR, "traces");
const PERFETTO_CONFIG = path.join(import.meta.dirname, "perfetto-startup.pbtx");
const DEVICE_PERFETTO_CONFIG = "/data/local/tmp/startup-perf.pbtx";
// The flow without the optional taps, for measured reads: when their prompts are absent, they wait
// up to ~7 s in all. Warm-ups keep the full flow (iOS asks to confirm a simulator's first openLink),
// and it is the retry when this one fails.
const QUICK_FLOW = path.join(import.meta.dirname, "read-performance-quick.yaml");
const SCROLL_FLOW = path.join(import.meta.dirname, "scroll-performance.yaml");
const SCROLL_TO_END_FLOW = path.join(import.meta.dirname, "scroll-performance-to-end.yaml");
// "App startup time" is the later of these two; a read before both exist would under-report it.
const FINAL_EVENTS = ["App started", "Splash screen faded"];
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
  if (!Number.isInteger(DUMP_HOME) || DUMP_HOME < 0) {
    throw new Error("--dump-home must be a whole number ≥ 0");
  }
  if (!Number.isInteger(TRACE_LAUNCHES) || TRACE_LAUNCHES < 0) {
    throw new Error("--trace-launches must be a whole number ≥ 0");
  }
  if (TRACE_LAUNCHES > 0 && PLATFORM !== "android") {
    throw new Error("--trace-launches is Android only");
  }
  if (TRACE_LAUNCHES > 0 && !existsSync(PERFETTO_CONFIG)) {
    throw new Error(`missing ${PERFETTO_CONFIG}`);
  }
  for (const s of SCENARIOS) {
    if (!["no-accounts", "accounts"].includes(s)) throw new Error(`unknown scenario ${s}`);
  }
}

process.env.MAESTRO_CLI_NO_ANALYTICS = "1";
process.env.MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED = "true";

// By default Maestro uninstalls and reinstalls its driver apps on every call (about 50 s per read
// in run 40006507791), which also keeps the host busy right before the next launch. Without the
// reinstall it installs them once, when missing.
// No wait for the update check at exit and no analytics upload; on iOS, no Android device listing.
const MAESTRO_ENV = Object.fromEntries(
  Object.entries({
    ...process.env,
    MAESTRO_DISABLE_UPDATE_CHECK: "true",
    MAESTRO_CLI_NO_ANALYTICS: "1",
  }).filter(([key]) => PLATFORM !== "ios" || !(key === "ANDROID" || key.startsWith("ANDROID_"))),
);
// iOS: one driver port per simulator, so the calls of a read reuse the driver the first one started
// (a `test` otherwise picks a random port and starts its own). The driver is still stopped before
// every launch.
const IOS_DRIVER_PORT = 22087;
// Every Maestro call of the current launch, with its duration, recorded in the sample.
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
    await run("adb", ["-s", device, "shell", "am", "force-stop", APP_ID], { allowFail: true });
    await this.stopDriver(device);
  },
  async stopDriver(device) {
    for (const pkg of ["dev.mobile.maestro", "dev.mobile.maestro.test"]) {
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
  // Screen state before a launch: wakefulness and the focused window. The job keeps the screen on
  // and the keyguard off, so waking it here should never be needed; when it is, the sample says so.
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
  // Virtual CPUs the emulator actually has (the -cores it was booted with).
  async cpuCount(device) {
    const { stdout, failed } = await run("adb", ["-s", device, "shell", "nproc"], {
      allowFail: true,
    });
    const count = Number(stdout.trim());
    return failed || !Number.isInteger(count) ? null : count;
  },
  // Epoch ms on the runner's clock at which the app process started. The startup events count
  // from process start, while `am start` spends a few hundred ms before the process exists.
  async processStart(device) {
    const before = Date.now();
    const { stdout, failed } = await run(
      "adb",
      ["-s", device, "shell", `cat /proc/uptime; cat /proc/$(pidof -s ${APP_ID})/stat`],
      { allowFail: true, timeoutMs: 20_000 },
    );
    const after = Date.now();
    if (failed) return null;
    const at = parseProcessStart(stdout, (before + after) / 2);
    return at === null ? null : { at, pid: parseStatPid(stdout) };
  },
  async pid(device) {
    const { stdout, failed } = await run("adb", ["-s", device, "shell", "pidof", "-s", APP_ID], {
      allowFail: true,
      timeoutMs: 20_000,
    });
    const pid = Number(stdout.trim());
    return failed || !Number.isInteger(pid) || pid <= 0 ? null : pid;
  },
  // Starts the emulator's own capture (console "network capture"), which only accepts a bare
  // file name and writes it under the AVD folder; returns the full path it reports.
  async startCapture(device, fileName) {
    const { stdout } = await run(
      "adb",
      ["-s", device, "emu", "network", "capture", "start", fileName],
      {
        timeoutMs: 30_000,
      },
    );
    const file = stdout.match(/capturing to (\S+\.pcap)/)?.[1];
    if (!file) throw new Error(`network capture start on ${device}: ${stdout.trim()}`);
    return file;
  },
  screenSizes: new Map(),
  // A slow swipe from 75% to 30% of the screen height, so the list moves about half a screen.
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
  // Three fast swipes fling the list to its end; then the momentum is left to stop.
  async scrollToEnd(device) {
    await this.scrollDown(device, { fling: true });
  },
  async stopCapture(device) {
    await run("adb", ["-s", device, "emu", "network", "capture", "stop"], {
      allowFail: true,
      timeoutMs: 30_000,
    });
  },
  // CPU time of each app thread so far, from /proc/<pid>/task/*/schedstat: time on a CPU and time
  // runnable but waiting for one. Read once the launch window is over, so it adds no load to it.
  // Also returns the uptime (CLOCK_BOOTTIME, a trace's clock) at which they were read.
  async threadStats(device, pid) {
    if (!pid) return null;
    const script = `cat /proc/uptime; cd /proc/${pid}/task 2>/dev/null && for t in *; do read -r c < $t/comm; read -r s < $t/schedstat; echo "$t|$c|$s"; done`;
    const { stdout, failed } = await run("adb", ["-s", device, "shell", script], {
      allowFail: true,
      timeoutMs: 20_000,
    });
    if (failed) return null;
    const uptime = Number(stdout.match(/^(\d+\.\d+) /m)?.[1]);
    return { atUptime: Number.isFinite(uptime) ? uptime : null, threads: parseThreadStats(stdout) };
  },
  // Two screenshots ~0.3 s apart, pulled to `${base}-1.png` / `-2.png`: their difference shows what
  // is still being redrawn.
  async screenshots(device, base) {
    await run("adb", [
      "-s",
      device,
      "shell",
      "screencap -p /data/local/tmp/startup-perf-1.png; sleep 0.3; screencap -p /data/local/tmp/startup-perf-2.png",
    ]);
    const files = [];
    for (const n of [1, 2]) {
      await run("adb", [
        "-s",
        device,
        "pull",
        `/data/local/tmp/startup-perf-${n}.png`,
        `${base}-${n}.png`,
      ]);
      files.push(`${base}-${n}.png`);
    }
    return files;
  },
  tracedDevices: new Set(),
  // Starts a background Perfetto trace; the config is piped in, since traced cannot read files the
  // shell user owns. The trace file must live in /data/misc/perfetto-traces.
  async startTrace(device, name) {
    if (!this.tracedDevices.has(device)) {
      await run("adb", ["-s", device, "push", PERFETTO_CONFIG, DEVICE_PERFETTO_CONFIG]);
      this.tracedDevices.add(device);
    }
    const file = `/data/misc/perfetto-traces/${name}.pftrace`;
    // With --background, perfetto prints the pid of the tracing process and exits.
    const { stdout } = await run(
      "adb",
      [
        "-s",
        device,
        "shell",
        `rm -f ${file}; cat ${DEVICE_PERFETTO_CONFIG} | perfetto --txt -c - -o ${file} --background 2>&1`,
      ],
      { timeoutMs: 30_000, allowFail: true },
    );
    const pid = Number(
      stdout
        .trim()
        .split("\n")
        .map(line => line.trim())
        .findLast(line => /^\d+$/.test(line)),
    );
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new Error(`perfetto did not start: ${stdout.trim().slice(-1000)}`);
    }
    return { pid, file };
  },
  // SIGTERM makes perfetto flush and write the trace; wait for it to exit before pulling the file.
  // Returns whether it exited, i.e. whether the pulled file is complete.
  async stopTrace(device, trace, dest) {
    await run("adb", ["-s", device, "shell", "kill", "-TERM", String(trace.pid)], {
      allowFail: true,
    });
    let exited = false;
    for (let i = 0; i < 60 && !exited; i++) {
      const { stdout } = await run("adb", ["-s", device, "shell", "pidof", "perfetto"], {
        allowFail: true,
      });
      exited = !stdout.trim().split(/\s+/).includes(String(trace.pid));
      if (!exited) await sleep(250);
    }
    try {
      if (dest) await run("adb", ["-s", device, "pull", trace.file, dest], { timeoutMs: 120_000 });
    } finally {
      await run("adb", ["-s", device, "shell", "rm", "-f", trace.file], { allowFail: true });
    }
    return exited;
  },
  async diagnostics(device, file) {
    const { stdout } = await run("adb", ["-s", device, "logcat", "-d", "-t", "3000"], {
      allowFail: true,
    });
    await writeFile(file, stdout);
  },
};

// /proc/uptime followed by /proc/<pid>/stat, read at `readAt` on the runner's clock. Field 22 of
// stat is the process start in clock ticks since boot (USER_HZ is 100 on Android).
export function parseProcessStart(text, readAt) {
  const uptime = Number(text.match(/^(\d+\.\d+) /m)?.[1]);
  const stat = text.slice(text.lastIndexOf(")") + 2).split(" ");
  const startTicks = Number(stat[19]);
  if (!Number.isFinite(uptime) || !Number.isFinite(startTicks)) return null;
  return Math.round(readAt - (uptime - startTicks / 100) * 1000);
}

// The pid, first field of the /proc/<pid>/stat line that follows /proc/uptime.
export function parseStatPid(text) {
  const pid = Number(text.match(/^(\d+) \(/m)?.[1]);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

// "<tid>|<name>|<run ns> <wait ns> <timeslices>" lines into the threads that ran at least 1 ms,
// busiest first, in ms.
export function parseThreadStats(text) {
  const threads = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^(\d+)\|(.*)\|(\d+) (\d+) (\d+)\s*$/);
    if (!m) continue;
    const runMs = Number(m[3]) / 1e6;
    if (runMs < 1) continue;
    threads.push({
      tid: Number(m[1]),
      name: m[2],
      runMs: Math.round(runMs * 10) / 10,
      waitMs: Math.round((Number(m[4]) / 1e6) * 10) / 10,
      slices: Number(m[5]),
    });
  }
  return threads.sort((a, b) => b.runMs - a.runMs);
}

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

// "mWakefulness=Awake" and "mCurrentFocus=Window{… u0 <name>}" lines; the keyguard has the focus
// through the notification shade (API 31+) or its own window.
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

const ios = {
  async install(device, app) {
    await run("xcrun", ["simctl", "uninstall", device, APP_ID], { allowFail: true });
    await run("xcrun", ["simctl", "install", device, app], { timeoutMs: 600_000 });
  },
  async stop(device) {
    await run("xcrun", ["simctl", "terminate", device, APP_ID], { allowFail: true });
    await this.stopDriver(device);
  },
  // The `xcodebuild test-without-building` running Maestro's driver outlives the Maestro call that
  // started it and would react to the driver's end during the next launch: end it first.
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
  async ensureScreenOn() {
    return null;
  },
  // Simulators are processes on the host: nothing to pause, and their load is the host's.
  async pause() {
    return false;
  },
  async resume() {},
  async cpuStat() {
    return null;
  },
  async processStart() {
    return null;
  },
  async pid() {
    return null;
  },
  async threadStats() {
    return null;
  },
  async screenshots() {
    return [];
  },
  async cpuCount() {
    return null;
  },
  async startCapture() {
    throw new Error("no emulator capture on iOS");
  },
  async stopCapture() {},
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

// The view ids (React Native testIDs) in a `maestro hierarchy` dump, in screen order, deduplicated.
export function hierarchyIds(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return [];
  let root;
  try {
    root = JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return [];
  }
  const ids = new Set();
  const visit = node => {
    const id = node?.attributes?.["resource-id"] ?? node?.attributes?.identifier;
    if (typeof id === "string" && id && !id.startsWith("android:")) ids.add(id);
    (node?.children ?? []).forEach(visit);
  };
  visit(root);
  return [...ids];
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
  return { appStartupTime: Number(value[1]), events: parseEvents(texts) };
}

// The "<event> (xN)" rows and their "<time> ms" on whatever part of the list is on screen.
export function parseEvents(texts) {
  const events = {};
  for (const m of texts.join("\n").matchAll(/([^\n,]+?) \(x(\d+)\)\s*,?\s*(-?\d+)\s*ms\b/g)) {
    events[m[1].trim()] = { count: Number(m[2]), time: Number(m[3]) };
  }
  return events;
}

// Maestro only dumps the rows on screen, so the list is scrolled until no new event shows up. Each
// scroll moves about half a screen; 10 covers the ~35 rows of the most instrumented builds.
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

// The first screen is already read; by default only the end of the list is added, where the rows
// are in the order the events were first logged, so the final events are there.
async function readRemainingEvents(device, events) {
  if (opts["all-events"]) return readAllEvents(device, events);
  await P.scrollToEnd(device);
  const all = { ...events, ...(await readHierarchyEvents(device)) };
  // A list too short to fling, or a fling that stopped early: fall back to scrolling.
  return FINAL_EVENTS.every(name => name in all) ? all : readAllEvents(device, all);
}

async function readPerformance(device, debugName, { quick }) {
  let lastTexts = [];
  let lastFlow = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const flow = quick && attempt === 1 && opts.flow === DEFAULT_FLOW ? QUICK_FLOW : opts.flow;
    // A driver stuck on an abandoned call would otherwise serve the retry too.
    if (attempt === 2) await P.stopDriver(device);
    // The first call on a device also installs Maestro's driver apps.
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

// curl timings from the runner, in ms: DNS lookup, TCP connect, TLS done, first byte, total.
async function curlTimings(url) {
  const { stdout, failed } = await run(
    "curl",
    [
      "-s",
      "-o",
      "/dev/null",
      "--max-time",
      "10",
      "-w",
      "%{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer} %{time_total} %{http_code}",
      url,
    ],
    { allowFail: true, timeoutMs: 15_000 },
  );
  const [dns, connect, tls, firstByte, total, status] = stdout.trim().split(" ").map(Number);
  if (failed || !Number.isFinite(total)) return { failed: true };
  const ms = s => Math.round(s * 1000);
  return {
    dnsMs: ms(dns),
    connectMs: ms(connect - dns),
    tlsMs: ms(tls - connect),
    firstByteMs: ms(firstByte - tls),
    totalMs: ms(total),
    status,
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

// Moves an emulator capture out of the AVD folder into <out-dir>/guest-network; returns its path
// relative to the out dir, as samples.jsonl records it.
async function keepCapture(file) {
  const dest = path.join(GUEST_PCAP_DIR, path.basename(file));
  await copyFile(file, dest);
  await unlink(file).catch(() => {});
  return path.relative(OUT_DIR, dest);
}

const consecutiveFailures = new Map();
let lastLaunchDevice = null;
const homeDumps = new Map();

// Whole rounds, spread evenly over each phase: ceil(N / 4) rounds per phase, both sides each.
function traceThis(meta) {
  if (TRACE_LAUNCHES === 0 || meta.warmup) return false;
  const perPhase = Math.ceil(TRACE_LAUNCHES / 4);
  const stride = Math.max(1, Math.floor(PAIRS / 2 / perPhase));
  return meta.round % stride === 0 && meta.round / stride < perPhase;
}

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
  maestroCalls = [];
  let readStart = null;
  let paused = false;
  let capturing = false;
  let trace = null;
  try {
    // Stop the app on both devices so the idle one is not syncing in the background.
    for (const device of DEVICES) await P.stop(device);
    const dialogs = [];
    for (const device of DEVICES) dialogs.push(...(await P.clearDialogs(device)));
    if (dialogs.length) {
      record.clearedDialogs = dialogs;
      await sleep(DIALOG_RECOVERY_MS);
    }
    record.screen = await P.ensureScreenOn(meta.device);
    if (NET_BASELINE.length) {
      record.runnerNetwork = {};
      for (const url of NET_BASELINE) record.runnerNetwork[url] = await curlTimings(url);
    }
    // Started before the idle wait, so its own start-up is over by the launch.
    if (traceThis(meta)) {
      record.traced = true;
      trace = await P.startTrace(meta.device, name).catch(error => {
        record.traceError = String(error?.message ?? error).slice(0, 500);
        console.log(`::warning title=No trace::${name}: ${record.traceError.split("\n")[0]}`);
        return null;
      });
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
    let captureFile = null;
    if (GUEST_CAPTURE) {
      captureFile = await P.startCapture(meta.device, `${name}.pcap`).catch(error => {
        log(`  no emulator capture for this launch: ${error.message}`);
        return null;
      });
      capturing = captureFile !== null;
    }
    // Host only: reading the device here would add work right before the launch.
    const launchStart = {
      ...idleEnd,
      at: Date.now(),
      host: hostCpuTimes(),
      throttledUs: await cgroupThrottledUs(),
    };
    // Epoch ms of the launch command, to line the launch up with a network capture.
    record.launchAt = Date.now();
    const launch = await P.launch(meta.device, { mock: "0" });
    await sleep(Math.min(LOAD_WINDOW_MS, SETTLE_MS));
    const launchEnd = await loadSnapshot(meta.device);
    record.load = {
      otherPaused: paused,
      beforeLaunch: loadBetween(idleStart, idleEnd),
      duringLaunch: loadBetween(launchStart, launchEnd),
    };
    const processStart = await P.processStart(meta.device);
    record.processStartAt = processStart?.at ?? null;
    record.pid = processStart?.pid ?? null;
    const threadStats = await P.threadStats(meta.device, record.pid);
    record.threads = threadStats?.threads ?? null;
    record.threadsAtUptime = threadStats?.atUptime ?? null;
    if (trace) {
      // A trace that cannot be kept must not cost the launch's measurement.
      const dest = path.join(TRACE_DIR, `${name}.pftrace`);
      try {
        record.traceComplete = await P.stopTrace(meta.device, trace, dest);
        record.trace = path.relative(OUT_DIR, dest);
      } catch (error) {
        record.traceError = String(error?.message ?? error).slice(0, 500);
        console.log(`::warning title=Trace lost::${name}: ${record.traceError.split("\n")[0]}`);
      } finally {
        trace = null;
      }
    }
    if (capturing) {
      capturing = false;
      await P.stopCapture(meta.device);
      record.guestPcap = await keepCapture(captureFile);
    }
    await sleep(Math.max(0, SETTLE_MS - LOAD_WINDOW_MS));
    if (paused) {
      paused = false;
      await P.resume(other);
    }
    if (!meta.warmup && (homeDumps.get(meta.scenario) ?? 0) < DUMP_HOME) {
      homeDumps.set(meta.scenario, (homeDumps.get(meta.scenario) ?? 0) + 1);
      const at = Date.now() - record.launchAt;
      const home = await maestro(meta.device, "hierarchy", [], { timeoutMs: 60_000 });
      const file = path.join(DEBUG_DIR, `${name}-home.json`);
      await writeFile(file, home.stdout);
      const shots = await P.screenshots(meta.device, path.join(DEBUG_DIR, `${name}-home`)).catch(
        () => [],
      );
      record.homeScreen = {
        at,
        file: path.relative(OUT_DIR, file),
        ids: hierarchyIds(home.stdout),
        shots: shots.map(f => path.relative(OUT_DIR, f)),
      };
    }
    // With a home dump just before, the read reuses the driver that dump started.
    readStart = Date.now();
    const perf = await readPerformance(meta.device, name, { quick: !meta.warmup });
    // A crash or restart between the launch and the read would show another launch's value.
    const pidAtRead = record.pid === null ? null : await P.pid(meta.device);
    if (record.pid !== null && pidAtRead !== record.pid) {
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
    if (capturing) await P.stopCapture(meta.device);
    if (trace) await P.stopTrace(meta.device, trace, null).catch(() => {});
  }
  if (readStart !== null) record.readMs = Date.now() - readStart;
  record.maestroCalls = maestroCalls;
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
  if (GUEST_CAPTURE) await mkdir(GUEST_PCAP_DIR, { recursive: true });
  if (TRACE_LAUNCHES > 0) await mkdir(TRACE_DIR, { recursive: true });
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
        guestCapture: GUEST_CAPTURE && PLATFORM === "android",
        traceLaunches: TRACE_LAUNCHES,
        hostCpus: os.cpus().length,
        deviceCpus: Object.fromEntries(
          await Promise.all(DEVICES.map(async d => [d, await P.cpuCount(d)])),
        ),
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
