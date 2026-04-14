import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { device } from "detox";
import { allure } from "jest-allure2-reporter/api";

const execFileAsync = promisify(execFile);

const LOGCAT_MAX_LINES = Number(process.env.DETOX_LOGCAT_ALLURE_MAX_LINES ?? "8000");

/**
 * Dumps the device log buffer via `adb logcat -d` and attaches it to the current Allure test/hook.
 * Complements detox-allure2-adapter's filtered stream (`app.log`) with a broader snapshot (ANR, crashes, system).
 */
export async function attachAdbLogcatSnapshotToAllure(): Promise<void> {
  if (device.getPlatform() !== "android") return;

  const adb = resolveAdbPath();
  if (!adb) {
    console.warn(
      "attachAdbLogcatSnapshotToAllure: adb not found (set ANDROID_HOME or ANDROID_SDK_ROOT)",
    );
    return;
  }

  const serial = device.id;
  const args = ["-s", serial, "logcat", "-d", "-t", String(LOGCAT_MAX_LINES), "-v", "threadtime"];

  try {
    const { stdout } = await execFileAsync(adb, args, {
      maxBuffer: 24 * 1024 * 1024,
      timeout: 60_000,
    });
    const body = stdout.trim() || "(empty logcat)";
    await allure.attachment("adb logcat snapshot (threadtime)", body, "text/plain");
  } catch (error) {
    console.warn("attachAdbLogcatSnapshotToAllure failed:", error);
  }
}

function resolveAdbPath(): string | null {
  const root = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!root) return null;
  return path.join(root, "platform-tools", "adb");
}
