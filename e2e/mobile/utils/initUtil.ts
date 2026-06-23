import { loadConfig, setFeatureFlags } from "../bridge/server";
import { isObservable, lastValueFrom, Observable } from "rxjs";
import { log } from "detox";
import { allure } from "jest-allure2-reporter/api";
import { SpeculosAppType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { isSpeculosRemote, isWallet40 } from "../helpers/commonHelpers";
import {
  deleteSpeculos,
  launchSpeculos,
  registerKnownSpeculos,
  registerSpeculos,
  removeSpeculosAndDeregisterKnownSpeculos,
} from "./speculosUtils";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";
import type { PartialFeatures } from "@shared/feature-flags";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { parseExtraFeatureFlags } from "@ledgerhq/live-common/e2e/featureFlagsJsonUtils";

function checkTestFailed(): void {
  if (globalThis.IS_FAILED) {
    throw new Error("Test failed - aborting initialization to prevent orphaned Speculos instances");
  }
}

type CliCommand = (
  userdataPath?: string,
  speculosAddress?: string,
) => Observable<unknown> | Promise<unknown> | string;

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

type Entry = {
  name: string;
  speculosPort: number;
  deviceId: string;
};

async function executeCliCommand(
  cmd: CliCommand,
  userdataPath?: string,
  speculosAddress?: string,
): Promise<unknown> {
  const resultOrPromise = await cmd(userdataPath, speculosAddress);

  let result: unknown;
  try {
    if (isObservable(resultOrPromise)) {
      result = await lastValueFrom(resultOrPromise);
    } else {
      result = resultOrPromise;
    }
  } catch (error) {
    log.error("[CLI] ❌ Error executing command:", sanitizeError(error));
    throw sanitizeError(error);
  }

  log.info("[CLI] 🎉 Final result:", result);
  return result;
}

// Setup all Speculos devices in parallel for better performance.
// If any launch fails, release the ones that already came up to avoid leaking pods.
async function launchSpeculosDevices(toStart: SpeculosAppType[]): Promise<Record<string, Entry>> {
  const results = await Promise.allSettled(
    toStart.map(async app => {
      checkTestFailed();
      const device = await launchSpeculos(app.name);
      return {
        name: app.name,
        speculosPort: device.port,
        deviceId: device.id,
      } satisfies Entry;
    }),
  );

  const launched: Entry[] = [];
  const failures: unknown[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") launched.push(result.value);
    else failures.push(result.reason);
  }

  if (failures.length) {
    await Promise.all(
      launched.map(entry =>
        deleteSpeculos(entry.deviceId).catch(err =>
          log.warn(
            "E2E",
            `Cleanup after partial launch failure: failed to delete ${entry.deviceId}: ${sanitizeError(err)}`,
          ),
        ),
      ),
    );
    throw new Error(
      `Failed to launch ${failures.length}/${toStart.length} Speculos device(s): ${failures
        .map(sanitizeError)
        .join("; ")}`,
    );
  }

  return launched.reduce<Record<string, Entry>>((acc, entry) => {
    acc[entry.name] = entry;
    return acc;
  }, {});
}

// Execute commands for each app with retry mechanism
async function executeCliCommandsOnApp(
  commandsByApp: Array<{ app: SpeculosAppType; cmds: CliCommand[] }>,
  entryMap: Record<string, Entry>,
  userdataPath: string,
  mainApp?: SpeculosAppType,
): Promise<void> {
  for (const { app, cmds } of commandsByApp) {
    const entry = entryMap[app.name];
    if (!entry) {
      throw new Error(`No entry found for app: ${app.name}`);
    }

    const maxRetries = 3;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      checkTestFailed();
      attempt++;

      try {
        const { speculosPort, deviceId } = entry;

        log.info(
          `\n🔄 [${app.name}] Attempt ${attempt}/${maxRetries} - Running ${cmds.length} command(s)`,
        );

        if (isSpeculosRemote()) await waitForSpeculosReady(entry.deviceId);
        await registerSpeculos(speculosPort);

        for (let i = 0; i < cmds.length; i++) {
          log.info(`  📝 [${app.name}] Executing command ${i + 1}/${cmds.length}`);
          await executeCliCommand(cmds[i], userdataPath, deviceId);
        }

        lastError = undefined;
        log.info(
          `✅ [${app.name}] All ${cmds.length} command(s) executed successfully on attempt ${attempt}`,
        );
        break;
      } catch (err) {
        lastError = err;

        if (attempt < maxRetries) {
          checkTestFailed();

          // Create fresh instance for next retry attempt
          await deleteSpeculos(entry.deviceId);
          const device = await launchSpeculos(app.name);

          entryMap[app.name] = {
            name: app.name,
            speculosPort: device.port,
            deviceId: device.id,
          };
        }
      }
    }

    if (lastError) {
      throw new Error(
        `❌ [${app.name}] Failed to setup account after ${maxRetries} attempts: ${sanitizeError(lastError)}`,
      );
    }

    if (mainApp?.name !== app.name) {
      await deleteSpeculos(entry.deviceId);
    }
  }
}

// Retry logic for main Speculos app setup with instance recreation
async function setupMainSpeculosApp(
  speculosApp: SpeculosAppType,
  entryMap: Record<string, Entry>,
): Promise<void> {
  const main = entryMap[speculosApp.name];
  if (!main) {
    throw new Error(`No entry found for main speculos app: ${speculosApp.name}`);
  }

  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    checkTestFailed();
    attempt++;

    try {
      log.info(`\n🔄 [${speculosApp.name}] Main setup attempt ${attempt}/${maxRetries}`);

      if (isSpeculosRemote()) await waitForSpeculosReady(main.deviceId);
      await registerSpeculos(main.speculosPort);
      await registerKnownSpeculos(main.speculosPort);
      log.info(
        `✅ [${speculosApp.name}] Main Speculos registered successfully on port ${main.speculosPort}`,
      );

      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        checkTestFailed();

        log.info(`[${speculosApp.name}] Creating new main Speculos instance for retry`);
        await removeSpeculosAndDeregisterKnownSpeculos(main.deviceId);
        const device = await launchSpeculos(main.name);

        entryMap[speculosApp.name] = {
          name: main.name,
          speculosPort: device.port,
          deviceId: device.id,
        };
      }
    }
  }

  if (lastError) {
    throw new Error(
      `❌ [${speculosApp.name}] Failed to setup main Speculos app after ${maxRetries} attempts: ${sanitizeError(lastError)}`,
    );
  }
}

// Execute global commands after all app-specific setup is complete
// On any failure (after per-command retries), delete and re-setup the main Speculos app
// and restart the full set of commands from the beginning.
async function executeCliCommands(
  cliCommands: CliCommand[],
  userdataPath: string,
  speculosApp?: SpeculosAppType,
  entryMap?: Record<string, Entry>,
): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    checkTestFailed();
    attempt++;
    log.info(`\n🔄 [Global CLI] Attempt ${attempt}/${maxRetries}`);
    try {
      for (const cmd of cliCommands) {
        await executeCliCommand(() => cmd(userdataPath));
      }
      lastError = undefined;
      log.info(`✅ [Global CLI] Full run succeeded on attempt ${attempt}`);
      break;
    } catch (err) {
      lastError = err;

      if (speculosApp && entryMap) {
        checkTestFailed();

        const main = entryMap[speculosApp.name];

        await removeSpeculosAndDeregisterKnownSpeculos(main.deviceId);
        const device = await launchSpeculos(speculosApp.name);
        entryMap[speculosApp.name] = {
          name: speculosApp.name,
          speculosPort: device.port,
          deviceId: device.id,
        };
        await setupMainSpeculosApp(speculosApp, entryMap);
      }

      if (attempt < maxRetries) {
        log.info(`[Global CLI] Retrying full command run (attempt ${attempt + 1}/${maxRetries})`);
      }
    }
  }

  if (lastError) {
    throw new Error(
      `❌ [Global CLI] Full run failed after ${maxRetries} attempts (with Speculos re-setup): ${sanitizeError(lastError)}`,
    );
  }
}

export class InitializationManager {
  static async initialize(
    options: InitOptions,
    userdataPath: string,
    userdataSpeculos: string,
  ): Promise<void> {
    const { speculosApp, cliCommands = [], cliCommandsOnApp = [], featureFlags = {} } = options;

    await InitializationManager.setFeatureFlags(featureFlags);

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
    const speculosDevices = await launchSpeculosDevices(appsToLaunch);

    // Execute app-specific commands with retry logic
    await executeCliCommandsOnApp(commandsByApp, speculosDevices, userdataPath, speculosApp);

    // Setup main Speculos app if specified
    if (speculosApp) {
      await setupMainSpeculosApp(speculosApp, speculosDevices);
      const mainEntry = speculosDevices[speculosApp.name];
      log.info(
        `✅ Main Speculos app [${speculosApp.name}] setup complete. Port: ${mainEntry.speculosPort}, Device: ${mainEntry.deviceId}`,
      );
    }

    // Execute global commands with internal full-run retry and Speculos re-initialization
    await executeCliCommands(cliCommands, userdataPath, speculosApp, speculosDevices);

    // Finalize setup only after successful global CLI run
    await loadConfig(userdataSpeculos, true);
  }

  static async setFeatureFlags(featureFlags: PartialFeatures) {
    const defaultFlags = {
      lwmWallet40: {
        enabled: isWallet40,
        params: {
          mainNavigation: isWallet40,
          marketBanner: isWallet40,
          graphRework: isWallet40,
          quickActionCtas: isWallet40,
          tour: false,
          lazyOnboarding: isWallet40,
          balanceRefreshRework: isWallet40,
          assetSection: false,
          operationsList: false,
          aggregatedAssets: false,
          myWallet: isWallet40,
          pnl: false,
          assetDiscoverability: false,
        },
      },
      onboardingWidget: {
        enabled: true,
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
    const extraFeatureFlags = parseExtraFeatureFlags<PartialFeatures>(
      process.env.E2E_FEATURE_FLAGS_JSON,
    );
    const mergedFeatureFlags = {
      ...defaultFlags,
      ...extraFeatureFlags,
      ...featureFlags,
    };
    await allure.attachment(
      "Merged Feature Flags",
      JSON.stringify(mergedFeatureFlags, null, 2),
      "application/json",
    );
    await setFeatureFlags(mergedFeatureFlags);
  }
}
