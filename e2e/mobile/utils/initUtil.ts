import { findFreePort, loadConfig, setFeatureFlags } from "../bridge/server";
import { isObservable, lastValueFrom, Observable } from "rxjs";
import { log } from "detox";
import { SpeculosAppType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { isRemoteIos } from "../helpers/commonHelpers";
import {
  deleteSpeculos,
  launchSpeculos,
  registerKnownSpeculos,
  registerSpeculos,
  removeSpeculosAndDeregisterKnownSpeculos,
} from "./speculosUtils";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "../../../apps/ledger-live-mobile/src/actions/types";

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
  featureFlags?: SettingsSetOverriddenFeatureFlagsPlayload;
};

type Entry = {
  name: string;
  speculosPort: number;
  proxyPort: number;
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
  } catch (err) {
    log.error("[CLI] ❌ Error executing command:", err);
    throw err;
  }

  log.info("[CLI] 🎉 Final result:", result);
  return result;
}

// Setup all Speculos devices in parallel for better performance
async function launchSpeculosDevices(toStart: SpeculosAppType[]): Promise<Record<string, Entry>> {
  const entries: Entry[] = await Promise.all(
    toStart.map(async app => {
      const proxyPort = await findFreePort();
      const device = await launchSpeculos(app.name);

      return {
        name: app.name,
        speculosPort: device.port,
        proxyPort,
        deviceId: device.id,
      };
    }),
  );

  return entries.reduce<Record<string, Entry>>((acc, entry) => {
    acc[entry.name] = entry;
    return acc;
  }, {});
}

// Execute commands for each app with retry mechanism
async function executeCliCommandsOnApp(
  uniqueOnApp: Array<{ app: SpeculosAppType; cmd: CliCommand }>,
  entryMap: Record<string, Entry>,
  userdataPath: string,
): Promise<void> {
  for (const { app, cmd } of uniqueOnApp) {
    const entry = entryMap[app.name];
    if (!entry) {
      throw new Error(`No entry found for app: ${app.name}`);
    }

    const maxRetries = 3;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      attempt++;

      try {
        const { speculosPort, proxyPort, deviceId } = entry;

        log.info(`\n🔄 [${app.name}] Attempt ${attempt}/${maxRetries}`);

        if (isRemoteIos()) await waitForSpeculosReady(entry.deviceId);
        await registerSpeculos(speculosPort, proxyPort);

        await executeCliCommand(cmd, userdataPath, deviceId);
        lastError = undefined;
        log.info(`✅ [${app.name}] Command executed successfully on attempt ${attempt}`);
        break;
      } catch (err) {
        lastError = err;

        if (attempt < maxRetries) {
          // Create fresh instance for next retry attempt
          await deleteSpeculos(entry.deviceId);
          const device = await launchSpeculos(app.name);

          entryMap[app.name] = {
            name: app.name,
            speculosPort: device.port,
            proxyPort: entry.proxyPort,
            deviceId: device.id,
          };
        }
      }
    }

    if (lastError) {
      throw new Error(
        `❌ [${app.name}] Failed to setup account after ${maxRetries} attempts: ${lastError}`,
      );
    }

    await deleteSpeculos(entry.deviceId);
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
    attempt++;

    try {
      log.info(`\n🔄 [${speculosApp.name}] Main setup attempt ${attempt}/${maxRetries}`);

      if (isRemoteIos()) await waitForSpeculosReady(main.deviceId);
      await registerSpeculos(main.speculosPort, main.proxyPort);
      await registerKnownSpeculos(main.proxyPort);
      log.info(
        `✅ [${speculosApp.name}] Main Speculos registered successfully on port ${main.speculosPort}`,
      );

      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        log.info(`[${speculosApp.name}] Creating new main Speculos instance for retry`);
        await removeSpeculosAndDeregisterKnownSpeculos(main.deviceId);
        const device = await launchSpeculos(main.name);

        entryMap[speculosApp.name] = {
          name: main.name,
          speculosPort: device.port,
          proxyPort: main.proxyPort,
          deviceId: device.id,
        };
      }
    }
  }

  if (lastError) {
    throw new Error(
      `❌ [${speculosApp.name}] Failed to setup main Speculos app after ${maxRetries} attempts: ${lastError}`,
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
        const main = entryMap[speculosApp.name];

        await removeSpeculosAndDeregisterKnownSpeculos(main.deviceId);
        const device = await launchSpeculos(speculosApp.name);
        entryMap[speculosApp.name] = {
          name: speculosApp.name,
          speculosPort: device.port,
          proxyPort: main.proxyPort,
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
      `❌ [Global CLI] Full run failed after ${maxRetries} attempts (with Speculos re-setup): ${lastError}`,
    );
  }
}

export class InitializationManager {
  static async initialize(
    options: InitOptions,
    userdataPath: string,
    userdataSpeculos: string,
  ): Promise<void> {
    const { speculosApp, cliCommands = [], cliCommandsOnApp = [], featureFlags } = options;

    // Deduplicate apps to avoid duplicate setup
    const uniqueOnApp = Array.from(
      new Map(cliCommandsOnApp.map(({ app, cmd }) => [app.name, { app, cmd }])).values(),
    );

    // Setup all required Speculos devices in parallel
    const appsToLaunch = uniqueOnApp.map(x => x.app).concat(speculosApp ? [speculosApp] : []);
    const speculosDevices = await launchSpeculosDevices(appsToLaunch);

    // Execute app-specific commands with retry logic
    await executeCliCommandsOnApp(uniqueOnApp, speculosDevices, userdataPath);

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
    if (featureFlags) await setFeatureFlags(featureFlags);
  }
}
