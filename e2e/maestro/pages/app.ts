import { execFileSync, execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { MaestroProject } from "../config/projects";
import { MaestroCommand, MaestroRuntime } from "../runtime/maestro";

// All four iOS bundle IDs the project may install side-by-side. We uninstall
// every one before each run so the simulator can never end up with two apps
// that share the same display name ("LL [DEV]") but different bundle IDs —
// which causes Maestro to launch the wrong build.
const IOS_BUNDLE_IDS = [
  "com.ledger.live",
  "com.ledger.live.debug",
  "com.ledger.live.dev",
  "com.ledger.live.dev.debug",
] as const;

const ANDROID_PACKAGE_IDS = [
  "com.ledger.live",
  "com.ledger.live.debug",
  "com.ledger.live.detox",
] as const;

export class MaestroApp {
  constructor(
    private readonly project: MaestroProject,
    private readonly maestro: MaestroRuntime,
  ) {}

  install() {
    if (this.project.platform === "ios") {
      this.installIos();
    } else {
      this.installAndroid();
    }
  }

  private installIos() {
    const appPath = path.resolve(this.project.appPath);
    if (!existsSync(appPath)) {
      throw new Error(
        `[maestro] iOS .app not found at ${appPath}.\n` +
          "Did you build for the right configuration?\n" +
          "  Release: pnpm mobile e2e:build -c ios.sim.release\n" +
          "  Debug:   pnpm mobile e2e:build -c ios.sim.debug",
      );
    }

    const actualBundleId = this.readIosBundleId(appPath);
    if (actualBundleId !== this.project.appId) {
      throw new Error(
        `[maestro] iOS bundle id mismatch.\n` +
          `  Project "${this.project.id}" expects appId="${this.project.appId}"\n` +
          `  But the .app at ${appPath}\n` +
          `  has CFBundleIdentifier="${actualBundleId}".\n` +
          `Rebuild with the matching configuration, or update e2e/maestro/config/projects.ts.`,
      );
    }

    console.info(`[maestro] Installing iOS app id=${actualBundleId}\n  from: ${appPath}`);

    for (const bundleId of IOS_BUNDLE_IDS) {
      this.execFileSyncQuietly("xcrun", ["simctl", "uninstall", "booted", bundleId]);
    }
    execFileSync("xcrun", ["simctl", "install", "booted", appPath], { stdio: "inherit" });
  }

  private installAndroid() {
    const apkPath = path.resolve(this.project.appPath);
    if (!existsSync(apkPath)) {
      throw new Error(
        `[maestro] Android APK not found at ${apkPath}.\n` +
          "Did you build for the right configuration?\n" +
          "  Release (detox APK): pnpm mobile e2e:build -c android.emu.release",
      );
    }

    console.info(
      `[maestro] Installing Android package id=${this.project.appId}\n  from: ${apkPath}`,
    );

    for (const pkg of ANDROID_PACKAGE_IDS) {
      this.execFileSyncQuietly("adb", ["uninstall", pkg]);
    }
    execFileSync("adb", ["install", "-r", apkPath], { stdio: "inherit" });
  }

  private readIosBundleId(appPath: string): string {
    const plist = path.join(appPath, "Info.plist");
    try {
      return execSync(`/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "${plist}"`)
        .toString()
        .trim();
    } catch (error) {
      throw new Error(
        `[maestro] Failed to read CFBundleIdentifier from ${plist}: ${String(error)}`,
      );
    }
  }

  private execFileSyncQuietly(command: string, args: string[]) {
    try {
      execFileSync(command, args, { stdio: "ignore" });
    } catch {
      // Best effort cleanup: uninstall fails when the app is not installed yet.
    }
  }

  async launch(arguments_: Record<string, string | number | boolean>) {
    await this.maestro.runFlow("launch-app", [
      {
        launchApp: {
          appId: this.project.appId,
          arguments: arguments_,
        },
      },
    ]);
  }

  openDeepLink(url: string) {
    if (this.project.platform === "ios") {
      execFileSync("xcrun", ["simctl", "openurl", "booted", url], { stdio: "inherit" });
    } else {
      execFileSync(
        "adb",
        ["shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", url],
        { stdio: "inherit" },
      );
    }
  }

  async runNativeFlow(name: string, commands: MaestroCommand[], env?: Record<string, string>) {
    await this.maestro.runFlow(name, commands, env);
  }
}
