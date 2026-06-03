import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { MaestroProject } from "../config/projects";
import { E2EBridge } from "../runtime/bridge";
import { FlowBuilder } from "../runtime/flowBuilder";
import { MaestroCommand, MaestroRuntime } from "../runtime/maestro";

function runAsync(
  command: string,
  args: string[],
  options: { ignoreErrors?: boolean } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: options.ignoreErrors ? "ignore" : "inherit" });
    child.on("error", error => (options.ignoreErrors ? resolve() : reject(error)));
    child.on("exit", code => {
      if (code === 0 || options.ignoreErrors) resolve();
      else reject(new Error(`\`${command} ${args.join(" ")}\` exited with code ${code}`));
    });
  });
}

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
    private readonly flow: FlowBuilder,
    private readonly bridge: E2EBridge,
  ) {}

  // Validates the build synchronously (so a missing/mismatched build fails fast),
  // then returns the async uninstall+install so it can run while Speculos boots.
  install(): Promise<void> {
    return this.project.platform === "ios" ? this.installIos() : this.installAndroid();
  }

  private installIos(): Promise<void> {
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
    return this.reinstall("xcrun", IOS_BUNDLE_IDS, ["simctl", "install", "booted", appPath]);
  }

  private installAndroid(): Promise<void> {
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
    return this.reinstall("adb", ANDROID_PACKAGE_IDS, ["install", "-r", apkPath]);
  }

  private async reinstall(
    tool: "xcrun" | "adb",
    bundleIds: readonly string[],
    installArgs: string[],
  ): Promise<void> {
    const uninstall = (id: string) =>
      tool === "xcrun" ? ["simctl", "uninstall", "booted", id] : ["uninstall", id];
    for (const id of bundleIds) {
      await runAsync(tool, uninstall(id), { ignoreErrors: true });
    }
    await runAsync(tool, installArgs);
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

  async openDeepLink(url: string): Promise<void> {
    await this.bridge.openDeeplink(url);
  }

  addStep(label: string, commands: MaestroCommand[]): void {
    this.flow.addStep(label, commands);
  }
}
