import { execFileSync, execSync, spawnSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { MaestroProject } from "../config/projects";
import { E2EBridge } from "../runtime/bridge";
import { MaestroCommand, MaestroRuntime } from "../runtime/maestro";

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
    private readonly bridge: E2EBridge,
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
    spawnSync(command, args, { stdio: "ignore" });
  }

  async launch(launchArgs: Record<string, string | number | boolean>) {
    await this.maestro.runFlow("launch-app", [
      {
        launchApp: {
          appId: this.project.appId,
          arguments: launchArgs,
        },
      },
    ]);
  }

  async openDeepLink(url: string) {
    await this.bridge.openDeeplink(url);
  }

  async runNativeFlow(name: string, commands: MaestroCommand[], env?: Record<string, string>) {
    await this.maestro.runFlow(name, commands, env);
  }
}
