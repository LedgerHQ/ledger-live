import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { INSTALL_TIMEOUT_MS, run, sleep } from "../exec.ts";
import type { Platform } from "../types.ts";

// Up to 15 s for Maestro's xcodebuild driver to exit.
const DRIVER_EXIT_POLLS = 30;
const DRIVER_EXIT_POLL_MS = 500;
const LOG_SHOW_TIMEOUT_MS = 120_000;
// A startup-log query takes under 1 s: this only bounds a hung `log show`.
const STARTUP_LOG_QUERY_TIMEOUT_MS = 30_000;

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
export function createIos({ appId }: { appId: string }): Platform {
  const pids = new Map<string, number | null>();

  // MMKV's default directory, in the data container simctl creates at install.
  async function storageDir(device: string): Promise<string> {
    const { stdout } = await run("xcrun", ["simctl", "get_app_container", device, appId, "data"]);
    return path.join(stdout.trim(), "Documents", "mmkv");
  }

  return {
    async install(device, app) {
      await run("xcrun", ["simctl", "uninstall", device, appId], { allowFail: true });
      await run("xcrun", ["simctl", "install", device, app], { timeoutMs: INSTALL_TIMEOUT_MS });
    },
    async stop(device) {
      await run("xcrun", ["simctl", "terminate", device, appId], { allowFail: true });
    },
    stopDriver,
    async writeStorage(device, files) {
      const dir = await storageDir(device);
      await mkdir(dir, { recursive: true });
      for (const [name, data] of Object.entries(files)) {
        await writeFile(path.join(dir, path.basename(name)), data);
      }
    },
    async readStorage(device, name) {
      const file = path.join(await storageDir(device), path.basename(name));
      return readFile(file).catch(() => null);
    },
    async launch(device, launchArgs = {}) {
      // react-native-launch-arguments reads "-key value" pairs from the process arguments.
      const args = Object.entries(launchArgs).flatMap(([k, v]) => [`-${k}`, String(v)]);
      const { stdout } = await run("xcrun", ["simctl", "launch", device, appId, ...args]);
      const pid = Number(/:\s*(\d+)\s*$/m.exec(stdout)?.[1]);
      pids.set(device, Number.isInteger(pid) && pid > 0 ? pid : null);
      return {};
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
