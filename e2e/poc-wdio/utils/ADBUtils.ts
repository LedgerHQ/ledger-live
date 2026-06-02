import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { copyFileSync, createWriteStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "artifacts/logs");

function adbPath(): string {
  return process.env.ADB_PATH ?? "adb";
}

function adbDeviceArgs(): string[] {
  const serial = process.env.ANDROID_SERIAL ?? process.env.ANDROID_DEVICE_SERIAL;
  return serial ? ["-s", serial] : [];
}

function slugify(label: string): string {
  return label.replace(/\s+/g, "-").toLowerCase().slice(0, 80);
}

export class ADBUtils {
  private static logcatProcess: ChildProcess | undefined;
  private static streamPath: string | undefined;

  static isDisabled(): boolean {
    return process.env.CAPTURE_ADB_LOGCAT === "0";
  }

  /** Starts a background `adb logcat` process writing to artifacts (no WebDriver session required). */
  static startLogcatStream(workerId = "0-0"): void {
    if (ADBUtils.isDisabled()) return;
    if (ADBUtils.logcatProcess) return;

    mkdirSync(LOG_DIR, { recursive: true });
    const streamPath = path.join(LOG_DIR, `logcat-stream-${workerId}.txt`);
    ADBUtils.streamPath = streamPath;

    try {
      execFileSync(adbPath(), [...adbDeviceArgs(), "logcat", "-c"], { stdio: "ignore" });
    } catch {
      // Non-fatal if clear fails (e.g. no device yet).
    }

    const out = createWriteStream(streamPath, { flags: "a" });
    const proc = spawn(adbPath(), [...adbDeviceArgs(), "logcat", "-v", "threadtime"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    ADBUtils.logcatProcess = proc;

    proc.stdout?.pipe(out);
    proc.stderr?.pipe(out);

    proc.on("error", err => {
      console.warn(`adb logcat stream failed to start: ${err.message}`);
      ADBUtils.logcatProcess = undefined;
    });

    proc.on("exit", (code, signal) => {
      if (code !== null && code !== 0) {
        console.warn(`adb logcat stream exited (code=${code}, signal=${signal})`);
      }
      ADBUtils.logcatProcess = undefined;
    });

    writeFileSync(
      streamPath,
      `\n===== logcat stream started ${new Date().toISOString()} (worker ${workerId}) =====\n`,
      { flag: "a" },
    );
    console.log(`ADB logcat streaming to ${streamPath}`);
  }

  static stopLogcatStream(): void {
    if (!ADBUtils.logcatProcess) return;
    ADBUtils.logcatProcess.kill("SIGTERM");
    ADBUtils.logcatProcess = undefined;
  }

  static markTestStart(testTitle: string): void {
    if (ADBUtils.isDisabled() || !ADBUtils.streamPath) return;
    writeFileSync(
      ADBUtils.streamPath,
      `\n===== TEST START: ${testTitle} (${new Date().toISOString()}) =====\n`,
      { flag: "a" },
    );
  }

  /**
   * Copies the live logcat stream to a labeled artifact file. Works even when the Appium session is dead.
   */
  static snapshotLogcatToArtifacts(label: string): string | undefined {
    if (ADBUtils.isDisabled()) return;
    if (!ADBUtils.streamPath || !existsSync(ADBUtils.streamPath)) {
      console.warn("No logcat stream file to snapshot");
      return;
    }

    mkdirSync(LOG_DIR, { recursive: true });
    const file = path.join(LOG_DIR, `logcat-${slugify(label)}-${Date.now()}.txt`);
    copyFileSync(ADBUtils.streamPath, file);
    console.log(`ADB logcat snapshot saved to ${file}`);
    return file;
  }

  /**
   * Best-effort logcat via WebDriver. Only use when the session is still alive.
   */
  static async dumpLogcatViaDriver(label: string): Promise<string | undefined> {
    if (ADBUtils.isDisabled()) return;
    try {
      const logs = (await driver.getLogs("logcat")) as Array<{ level: string; message: string }>;
      mkdirSync(LOG_DIR, { recursive: true });
      const file = path.join(LOG_DIR, `logcat-driver-${slugify(label)}-${Date.now()}.txt`);
      const body = logs.map(entry => `[${entry.level}] ${entry.message}`).join("\n");
      writeFileSync(file, body, "utf8");
      console.log(`ADB logcat (driver) saved to ${file}`);
      return file;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`driver.getLogs("logcat") skipped: ${message}`);
      return undefined;
    }
  }
}

export default ADBUtils;
