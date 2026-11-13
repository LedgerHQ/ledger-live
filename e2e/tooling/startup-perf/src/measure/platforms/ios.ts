import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DEVICE_QUERY_TIMEOUT_MS, INSTALL_TIMEOUT_MS, run, sleep } from "../exec.ts";
import { FLOWS_DIR, MAESTRO_SCROLL_TIMEOUT_MS } from "../maestro.ts";
import type { Maestro, Platform } from "../types.ts";

// Up to 15 s for Maestro's xcodebuild driver to exit.
const DRIVER_EXIT_POLLS = 30;
const DRIVER_EXIT_POLL_MS = 500;
const LOG_SHOW_TIMEOUT_MS = 120_000;
// A startup-log query takes under 1 s: this only bounds a hung `log show`.
const STARTUP_LOG_QUERY_TIMEOUT_MS = 30_000;

const SCROLL_FLOW = path.join(FLOWS_DIR, "scroll-performance.yaml");
const SCROLL_TO_END_FLOW = path.join(FLOWS_DIR, "scroll-performance-to-end.yaml");

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

// Maestro's xcodebuild driver outlives the call that started it.
async function stopDriver(device: string): Promise<void> {
  const xcodebuild = `test-without-building.*id=${device}`;
  await run("pkill", ["-f", xcodebuild], { allowFail: true });
  for (let i = 0; i < DRIVER_EXIT_POLLS; i++) {
    if ((await run("pgrep", ["-f", xcodebuild], { allowFail: true })).failed) break;
    await sleep(DRIVER_EXIT_POLL_MS);
  }
  await run(
    "xcrun",
    ["simctl", "terminate", device, "dev.mobile.maestro-driver-iosUITests.xctrunner"],
    {
      allowFail: true,
    },
  );
}

/** iOS simulators, through simctl. */
export function createIos({ appId, maestro }: { appId: string; maestro: Maestro }): Platform {
  const pids = new Map<string, number | null>();

  return {
    async install(device, app) {
      await run("xcrun", ["simctl", "uninstall", device, appId], { allowFail: true });
      await run("xcrun", ["simctl", "install", device, app], { timeoutMs: INSTALL_TIMEOUT_MS });
    },
    async stop(device) {
      await run("xcrun", ["simctl", "terminate", device, appId], { allowFail: true });
      await stopDriver(device);
    },
    stopDriver,
    async launch(device, launchArgs = {}) {
      // react-native-launch-arguments reads "-key value" pairs from the process arguments.
      const args = Object.entries(launchArgs).flatMap(([k, v]) => [`-${k}`, String(v)]);
      const { stdout } = await run("xcrun", ["simctl", "launch", device, appId, ...args]);
      const pid = Number(/:\s*(\d+)\s*$/m.exec(stdout)?.[1]);
      pids.set(device, Number.isInteger(pid) && pid > 0 ? pid : null);
      return {};
    },
    async processStart(device) {
      const pid = pids.get(device);
      if (!pid) return null;
      const { stdout, failed } = await run("python3", ["-c", PROCESS_START_PY, String(pid)], {
        allowFail: true,
        timeoutMs: DEVICE_QUERY_TIMEOUT_MS,
      });
      const at = Number(stdout.trim());
      return failed || !Number.isFinite(at) ? null : { at, appClockAt: at, pid };
    },
    async pid(device) {
      const pid = pids.get(device);
      if (!pid) return null;
      return (await run("kill", ["-0", String(pid)], { allowFail: true })).failed ? null : pid;
    },
    async jsLog(device, pid, text) {
      const predicate = `processID == ${pid} AND eventMessage CONTAINS ${JSON.stringify(text)}`;
      const { stdout } = await run(
        "xcrun",
        ["simctl", "spawn", device, "log", "show", "--last", "2m", "--style", "compact"].concat([
          "--predicate",
          predicate,
        ]),
        { allowFail: true, timeoutMs: STARTUP_LOG_QUERY_TIMEOUT_MS },
      );
      return stdout;
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
      await maestro.invoke({
        device,
        command: "test",
        args: [SCROLL_FLOW],
        timeoutMs: MAESTRO_SCROLL_TIMEOUT_MS,
      });
    },
    async scrollToEnd(device) {
      await maestro.invoke({
        device,
        command: "test",
        args: [SCROLL_TO_END_FLOW],
        timeoutMs: MAESTRO_SCROLL_TIMEOUT_MS,
      });
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
        { allowFail: true, timeoutMs: LOG_SHOW_TIMEOUT_MS },
      );
      await writeFile(file, stdout);
    },
  };
}
