import { execFileSync } from "child_process";
import { MaestroProject } from "../config/projects";
import { MaestroCommand, MaestroRuntime } from "../runtime/maestro";

export class MaestroApp {
  constructor(
    private readonly project: MaestroProject,
    private readonly maestro: MaestroRuntime,
  ) {}

  install() {
    if (this.project.platform === "ios") {
      this.execFileSyncQuietly("xcrun", ["simctl", "uninstall", "booted", this.project.appId]);
      execFileSync("xcrun", ["simctl", "install", "booted", this.project.appPath], {
        stdio: "inherit",
      });
    } else {
      this.execFileSyncQuietly("adb", ["uninstall", this.project.appId]);
      execFileSync("adb", ["install", "-r", this.project.appPath], { stdio: "inherit" });
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
