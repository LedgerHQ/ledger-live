import { execFileSync } from "node:child_process";

/** Packages that register extra webview devtools sockets and amplify Appium context discovery. */
const SIDE_APP_PACKAGES = ["com.google.android.googlequicksearchbox"] as const;

export function getAndroidDeviceSerial(): string {
  return (
    driver.capabilities.deviceUDID ??
    driver.capabilities["appium:udid"] ??
    driver.capabilities["appium:deviceName"] ??
    "emulator-5554"
  );
}

/**
 * Reduces stray webviews on the emulator (notably Google app) that cause extra CDP/ps -A work.
 * Safe to call once per session in before().
 */
export function quietAndroidSideApps(): void {
  if (!driver.isAndroid) {
    return;
  }
  const serial = getAndroidDeviceSerial();
  for (const pkg of SIDE_APP_PACKAGES) {
    try {
      execFileSync(
        "adb",
        ["-s", serial, "shell", "pm", "disable-user", "--user", "0", pkg],
        { stdio: "pipe" },
      );
    } catch {
      try {
        execFileSync("adb", ["-s", serial, "shell", "am", "force-stop", pkg], { stdio: "pipe" });
      } catch {
        // Best-effort only; tests can still run if disable fails.
      }
    }
  }
}
