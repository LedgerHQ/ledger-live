import type { SpeculosAppType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import type { PartialFeatures } from "@shared/feature-flags";
import { CLIUtils, type CliCommand } from "./CLIUtils.ts";
import { SpeculosUtils } from "./SpeculosUtils.ts";
import { loadConfig, setFeatureFlags } from "../bridge/server.ts";

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

const IS_WALLET_40 = process.env.E2E_ENABLE_WALLET40 !== "0";

export class InitializationManager {
  static async initialize(
    options: InitOptions,
    userdataPath: string,
    userdataSpeculos: string,
  ): Promise<void> {
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
      userdataPath,
      speculosApp,
    );

    // Setup main Speculos app if specified
    if (speculosApp) {
      await SpeculosUtils.setupMainSpeculosApp(speculosApp, speculosDevices);
      const mainEntry = speculosDevices[speculosApp.name];
      console.info(
        `✅ Main Speculos app [${speculosApp.name}] setup complete. Port: ${mainEntry.speculosPort}, Device: ${mainEntry.deviceId}`,
      );
    }

    // Execute global commands with internal full-run retry and Speculos re-initialization
    await CLIUtils.executeCliCommands(cliCommands, userdataPath, speculosApp, speculosDevices);

    // Finalize setup only after successful global CLI run
    loadConfig(userdataSpeculos, true);
    const defaultFlags = {
      lwmWallet40: {
        enabled: IS_WALLET_40,
        params: {
          mainNavigation: IS_WALLET_40,
          marketBanner: IS_WALLET_40,
          graphRework: IS_WALLET_40,
          quickActionCtas: IS_WALLET_40,
          tour: false,
          lazyOnboarding: IS_WALLET_40,
          balanceRefreshRework: IS_WALLET_40,
          assetSection: false,
          onboardingWidget: IS_WALLET_40,
          operationsList: false,
          aggregatedAssets: false,
          myWallet: IS_WALLET_40,
          pnl: false,
        },
      },
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
    };
    await setFeatureFlags({
      ...defaultFlags,
      ...featureFlags,
    });
  }
}
