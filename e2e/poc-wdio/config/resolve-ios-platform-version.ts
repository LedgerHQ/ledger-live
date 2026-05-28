import { execSync } from "node:child_process";

type SimctlRuntimesJson = {
  runtimes?: Array<{ version?: string }>;
};

/**
 * Resolves the iOS Simulator platform version for Appium capabilities.
 * Uses APPIUM_PLATFORM_VERSION when set; otherwise picks the latest iOS runtime
 * from `xcrun simctl` (same approach as mobile E2E CI).
 */
export function resolveIosPlatformVersion(): string {
  const fromEnv = process.env.APPIUM_PLATFORM_VERSION?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  try {
    const output = execSync("xcrun simctl list runtimes iOS -j", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const parsed = JSON.parse(output) as SimctlRuntimesJson;
    const version = parsed.runtimes?.at(-1)?.version;
    if (version) {
      return version;
    }
  } catch {
    // fall through to error below
  }

  throw new Error(
    "Could not resolve iOS Simulator platform version. Run on macOS with Xcode installed, or set APPIUM_PLATFORM_VERSION.",
  );
}
