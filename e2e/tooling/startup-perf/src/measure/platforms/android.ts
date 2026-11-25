import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEVICE_QUERY_TIMEOUT_MS, INSTALL_TIMEOUT_MS, log, run, sleep } from "../exec.ts";
import type { Platform } from "../types.ts";

const EMULATOR_PAUSE_TIMEOUT_MS = 30_000;
// Where adb pushes and pulls the storage files: the shell user can read and write it, root copies.
const DEVICE_TMP_DIR = "/data/local/tmp/startup-perf-storage";
const SHELL_SAFE = /^[\w.-]+$/;
// Before the screen state is read again after a wake key.
const WAKE_SETTLE_MS = 1000;
// Before the dialog is checked again after its process was killed.
const DIALOG_RESTART_MS = 5000;

async function stopDriver(device: string): Promise<void> {
  for (const pkg of ["dev.mobile.maestro", "dev.mobile.maestro.test"]) {
    await run("adb", ["-s", device, "shell", "am", "force-stop", pkg], { allowFail: true });
  }
}

async function blockingDialog(device: string): Promise<string | null> {
  const { stdout } = await run("adb", ["-s", device, "shell", "dumpsys", "window"], {
    allowFail: true,
  });
  return parseBlockingDialog(stdout);
}

/** Runs `script` as root on the device: the E2E emulators have `su` (google_apis images). */
async function asRoot(device: string, script: string, allowFail = false) {
  if (script.includes("'")) throw new Error("asRoot: the script cannot hold a single quote");
  return run("adb", ["-s", device, "shell", `su 0 sh -c '${script}'`], { allowFail });
}

/** Android emulators, through adb. */
export function createAndroid({ appId }: { appId: string }): Platform {
  if (!SHELL_SAFE.test(appId)) throw new Error(`unexpected app id ${appId}`);
  const components = new Map<string, string>();
  const appDir = `/data/data/${appId}`;
  const storageDir = `${appDir}/files/mmkv`;

  async function component(device: string): Promise<string> {
    const known = components.get(device);
    if (known) return known;
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
      appId,
    ]);
    const found = stdout
      .split("\n")
      .map(l => l.trim())
      .reverse()
      .find(l => l.includes("/"));
    if (!found) throw new Error(`no launcher activity found for ${appId}: ${stdout}`);
    components.set(device, found);
    return found;
  }

  return {
    async install(device, apk) {
      await run("adb", ["-s", device, "uninstall", appId], { allowFail: true });
      // --no-incremental: an incremental install skips install-time dexopt on Android 16.
      await run("adb", ["-s", device, "install", "--no-incremental", "-r", "-g", apk], {
        timeoutMs: INSTALL_TIMEOUT_MS,
      });
      components.delete(device);
    },
    async stop(device) {
      await run("adb", ["-s", device, "shell", "am", "force-stop", appId], { allowFail: true });
    },
    stopDriver,
    async writeStorage(device, files) {
      const names = Object.keys(files);
      if (!names.length || !names.every(name => SHELL_SAFE.test(name))) {
        throw new Error(`unexpected storage file names: ${names.join(", ")}`);
      }
      const local = await mkdtemp(path.join(tmpdir(), "startup-perf-storage-"));
      try {
        for (const name of names) await writeFile(path.join(local, name), files[name]);
        await run("adb", ["-s", device, "shell", "rm", "-rf", DEVICE_TMP_DIR]);
        await run("adb", ["-s", device, "shell", "mkdir", "-p", DEVICE_TMP_DIR]);
        await run("adb", [
          "-s",
          device,
          "push",
          ...names.map(name => path.join(local, name)),
          DEVICE_TMP_DIR,
        ]);
        // Owned by the app's user, with its data directory's SELinux label, as if it wrote them.
        await asRoot(
          device,
          [
            `uid=$(stat -c %u ${appDir})`,
            `label=$(stat -c %C ${appDir})`,
            `mkdir -p ${storageDir}`,
            ...names.map(name => `cp ${DEVICE_TMP_DIR}/${name} ${storageDir}/${name}`),
            `chown -R $uid:$uid ${appDir}/files`,
            `chmod 700 ${appDir}/files ${storageDir}`,
            ...names.map(name => `chmod 600 ${storageDir}/${name}`),
            `chcon -R $label ${appDir}/files`,
            `rm -rf ${DEVICE_TMP_DIR}`,
          ].join(" && "),
        );
      } finally {
        await rm(local, { recursive: true, force: true });
      }
    },
    async readStorage(device, name) {
      if (!SHELL_SAFE.test(name)) throw new Error(`unexpected storage file name ${name}`);
      const copy = `${DEVICE_TMP_DIR}-${name}`;
      const copied = await asRoot(
        device,
        `cp ${storageDir}/${name} ${copy} && chmod 644 ${copy}`,
        true,
      );
      if (copied.failed) return null;
      const local = await mkdtemp(path.join(tmpdir(), "startup-perf-storage-"));
      try {
        await run("adb", ["-s", device, "pull", copy, path.join(local, name)]);
        return await readFile(path.join(local, name));
      } finally {
        await run("adb", ["-s", device, "shell", "rm", "-f", copy], { allowFail: true });
        await rm(local, { recursive: true, force: true });
      }
    },
    async launch(device, launchArgs = {}) {
      const extras = Object.entries(launchArgs).flatMap(([k, v]) => ["--es", k, String(v)]);
      const { stdout } = await run("adb", [
        "-s",
        device,
        "shell",
        "am",
        "start",
        "-W",
        "-n",
        await component(device),
        ...extras,
      ]);
      const field = (name: string) => new RegExp(`^${name}: (.+)$`, "m").exec(stdout)?.[1]?.trim();
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
          { allowFail: true, timeoutMs: DEVICE_QUERY_TIMEOUT_MS },
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
      await sleep(WAKE_SETTLE_MS);
      return { ...(await read()), wokenFrom: before };
    },
    blockingDialog,
    // Like tools/scripts/wait_emulator_idle.sh for the E2E emulators.
    async clearDialogs(device) {
      const cleared: string[] = [];
      let pkg = await blockingDialog(device);
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
        await sleep(DIALOG_RESTART_MS);
        pkg = await blockingDialog(device);
      }
      return cleared;
    },
    // Freezes the emulator's vCPUs; adb commands sent to it wait until "avd start".
    async pause(device) {
      const { stdout } = await run("adb", ["-s", device, "emu", "avd", "stop"], {
        timeoutMs: EMULATOR_PAUSE_TIMEOUT_MS,
      });
      if (!/^OK/m.test(stdout)) throw new Error(`avd stop on ${device}: ${stdout.trim()}`);
      return true;
    },
    async resume(device) {
      const { stdout } = await run("adb", ["-s", device, "emu", "avd", "start"], {
        timeoutMs: EMULATOR_PAUSE_TIMEOUT_MS,
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
          `echo "epoch \${EPOCHREALTIME:-$(date +%s.%N)}"; cat /proc/uptime; cat /proc/$(pidof -s ${appId})/stat`,
        ],
        { allowFail: true, timeoutMs: DEVICE_QUERY_TIMEOUT_MS },
      );
      const after = Date.now();
      if (failed) return null;
      const at = parseProcessStart(stdout, (before + after) / 2);
      const guestEpoch = Number(/^epoch (\d+\.\d+)/m.exec(stdout)?.[1]) * 1000;
      const appClockAt = Number.isFinite(guestEpoch) ? parseProcessStart(stdout, guestEpoch) : null;
      return at === null ? null : { at, appClockAt, pid: parseStatPid(stdout) };
    },
    async pid(device) {
      const { stdout, failed } = await run("adb", ["-s", device, "shell", "pidof", "-s", appId], {
        allowFail: true,
        timeoutMs: DEVICE_QUERY_TIMEOUT_MS,
      });
      const pid = Number(stdout.trim());
      return failed || !Number.isInteger(pid) || pid <= 0 ? null : pid;
    },
    async jsLog(device, pid, text) {
      const { stdout } = await run(
        "adb",
        ["-s", device, "logcat", "-d", "-v", "raw", `--pid=${pid}`, "-s", "ReactNativeJS"],
        { allowFail: true, timeoutMs: DEVICE_QUERY_TIMEOUT_MS },
      );
      return stdout
        .split("\n")
        .filter(line => line.includes(text))
        .join("\n");
    },
    async diagnostics(device, file) {
      const { stdout } = await run("adb", ["-s", device, "logcat", "-d", "-t", "3000"], {
        allowFail: true,
      });
      await writeFile(file, stdout);
    },
  };
}

// Field 22 of /proc/<pid>/stat is the process start in clock ticks since boot (USER_HZ = 100).
export function parseProcessStart(text: string, readAt: number): number | null {
  const uptime = Number(/^(\d+\.\d+) /m.exec(text)?.[1]);
  const stat = text.slice(text.lastIndexOf(")") + 2).split(" ");
  const startTicks = Number(stat[19]);
  if (!Number.isFinite(uptime) || !Number.isFinite(startTicks)) return null;
  return Math.round(readAt - (uptime - startTicks / 100) * 1000);
}

export function parseStatPid(text: string): number | null {
  const pid = Number(/^(\d+) \(/m.exec(text)?.[1]);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

export interface ScreenState {
  wakefulness: string | null;
  focus: string | null;
  keyguard: boolean;
}

export function parseScreenState(text: string): ScreenState {
  const focus = /mCurrentFocus=Window\{\S+ \S+ ([^}]+)\}/.exec(text)?.[1]?.trim() ?? null;
  return {
    wakefulness: /mWakefulness=(\w+)/.exec(text)?.[1] ?? null,
    focus,
    keyguard: /NotificationShade|Keyguard/i.test(focus ?? ""),
  };
}

export function parseBlockingDialog(dumpsysWindow: string): string | null {
  return (
    /mCurrentFocus=.*(?:Application Not Responding|Application Error): ([\w.]+)/.exec(
      dumpsysWindow,
    )?.[1] ?? null
  );
}
