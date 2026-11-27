import type { SpeculosAppType } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import type { PartialFeatures } from "@shared/feature-flags";
import logger from "@wdio/logger";
import { randomUUID } from "node:crypto";
import { copyFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { loadConfig, setFeatureFlags } from "@e2e-mobile/bridge/server";
import { CLIUtils, type CliCommand } from "@e2e-mobile/utils/CLIUtils";
import { SpeculosUtils } from "@e2e-mobile/utils/SpeculosUtils";

const initManagerLogger = logger("Initialisation Manager");

export type InitOptions = {
  speculosApp?: SpeculosAppType;
  cliCommands?: CliCommand[];
  cliCommandsOnApp?: {
    app: SpeculosAppType;
    cmd: CliCommand;
  }[];
  userdata?: string;
  testedCurrencies?: string[];
  featureFlags?: PartialFeatures;
};

export class InitializationManager {
  static async initialize(options: InitOptions): Promise<void> {
    const userDataString = `temp-userdata-${randomUUID()}`;
    const userDataPathSpeculos = path.resolve("userdata", `${userDataString}.json`);
    const userDataTest = path.resolve("userdata", `${options.userdata || "skip-onboarding"}.json`);

    copyFileSync(userDataTest, userDataPathSpeculos);
    try {
      const { speculosApp, cliCommands = [], cliCommandsOnApp = [], featureFlags } = options;

      // Group commands by app name
      const commandsByAppMap = new Map<string, { app: SpeculosAppType; cmds: CliCommand[] }>();
      for (const { app, cmd } of cliCommandsOnApp) {
        const existing = commandsByAppMap.get(app.name);
        if (existing) {
          existing.cmds.push(cmd);
        } else {
          commandsByAppMap.set(app.name, { app, cmds: [cmd] });
        }
      }
      const commandsByApp = Array.from(commandsByAppMap.values());

      // Setup all required Speculos devices in parallel
      const appsToLaunch = [
        ...new Map(
          commandsByApp
            .map(x => x.app)
            .concat(speculosApp ? [speculosApp] : [])
            .map(app => [app.name, app]),
        ).values(),
      ];
      const speculosDevices = await SpeculosUtils.launchSpeculosDevices(appsToLaunch);

      // Execute app-specific commands with retry logic
      await CLIUtils.executeCliCommandsOnApp(
        commandsByApp,
        speculosDevices,
        userDataPathSpeculos,
        speculosApp,
      );

      // Setup main Speculos app if specified
      if (speculosApp) {
        await SpeculosUtils.setupMainSpeculosApp(speculosApp, speculosDevices);
        const mainEntry = speculosDevices[speculosApp.name];
        initManagerLogger.info(
          `✅ Main Speculos app [${speculosApp.name}] setup complete. Port: ${mainEntry.speculosPort}, Device: ${mainEntry.deviceId}`,
        );
      }

      // Execute global commands with internal full-run retry and Speculos re-initialization
      await CLIUtils.executeCliCommands(
        cliCommands,
        userDataPathSpeculos,
        speculosApp,
        speculosDevices,
      );

      // Finalize setup only after successful global CLI run
      await loadConfig(userDataString, true);
      await setFeatureFlags({
        llmModularDrawer: {
          enabled: true,
          params: {
            add_account: true,
            live_app: true,
            live_apps_allowlist: [],
            live_apps_blocklist: ["revoke-cash"],
            receive_flow: true,
            send_flow: false,
            enableModularization: true,
            searchDebounceTime: 300,
            backendEnvironment: "PROD",
          },
        },
        ...featureFlags,
      });
    } finally {
      unlinkSync(userDataPathSpeculos);
    }
  }
}
