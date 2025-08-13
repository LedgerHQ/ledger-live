import { findFreePort, loadConfig, setFeatureFlags } from "../bridge/server";
import { isObservable, lastValueFrom, Observable } from "rxjs";
import { log } from "detox";
import { SpeculosAppType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { isRemoteIos, slugify } from "../helpers/commonHelpers";
import { launchSpeculos, registerSpeculos, removeSpeculos } from "./speculosUtils";
import {
  getSpeculosAddress,
  uniqueId,
  waitForSpeculosReady,
} from "@ledgerhq/live-common/e2e/speculosCI";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";

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
  runId?: string;
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
async function setupSpeculosDevices(toStart: SpeculosAppType[]): Promise<Record<string, Entry>> {
  const entries: Entry[] = await Promise.all(
    toStart.map(async app => {
      const proxyPort = await findFreePort();
      const runId = isRemoteIos() ? `${slugify(app.name)}-${uniqueId()}` : undefined;
      const device = await launchSpeculos(app.name, runId);

      return {
        name: app.name,
        speculosPort: device.port,
        proxyPort,
        runId,
      };
    }),
  );

  return entries.reduce(
    (acc, entry) => {
      acc[entry.name] = entry;
      return acc;
    },
    {} as Record<string, Entry>,
  );
}

// Wait for remote Speculos to be ready before proceeding
async function waitForSpeculosIfRemote(entry: Entry): Promise<void> {
  if (isRemoteIos() && entry.runId) {
    const address = getSpeculosAddress(entry.runId);
    log.info(`⏳ Waiting for remote Speculos at ${address}`);
    await waitForSpeculosReady(address);
  }
}

// Single attempt to execute a command with proper cleanup on failure
async function executeCommandAttempt(
  app: SpeculosAppType,
  cmd: CliCommand,
  entry: Entry,
  userdataPath: string,
  attempt: number,
  maxRetries: number,
): Promise<boolean> {
  const { speculosPort, proxyPort, runId } = entry;

  log.info(`\n🔄 [${app.name}] Attempt ${attempt}/${maxRetries}`);

  await waitForSpeculosIfRemote(entry);
  await registerSpeculos(speculosPort, proxyPort);

  try {
    await executeCliCommand(cmd, userdataPath, runId);
    return true;
  } catch (err) {
    // Clean up failed instance before retry
    await removeSpeculos(isRemoteIos() && runId ? runId : speculosPort);
    throw err;
  }
}

// Create fresh Speculos instance for retry attempts
async function createNewSpeculosInstance(
  app: SpeculosAppType,
  currentEntry: Entry,
): Promise<Entry> {
  const runId = isRemoteIos() ? `${slugify(app.name)}-${uniqueId()}` : undefined;
  const device = await launchSpeculos(app.name, runId);

  return {
    name: app.name,
    speculosPort: device.port,
    proxyPort: currentEntry.proxyPort,
    runId: device.id,
  };
}

// Retry logic with fresh instance creation on failures
async function executeAppCommandWithRetry(
  app: SpeculosAppType,
  cmd: CliCommand,
  entryMap: Record<string, Entry>,
  userdataPath: string,
): Promise<void> {
  let entry = entryMap[app.name];
  if (!entry) {
    throw new Error(`No entry found for app: ${app.name}`);
  }

  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    attempt++;

    try {
      const success = await executeCommandAttempt(
        app,
        cmd,
        entry,
        userdataPath,
        attempt,
        maxRetries,
      );

      if (success) {
        lastError = undefined;
        break;
      }
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        // Create fresh instance for next retry attempt
        await removeSpeculos(isRemoteIos() && entry.runId ? entry.runId : entry.speculosPort);
        entry = await createNewSpeculosInstance(app, entry);
        entryMap[app.name] = entry;
      }
    }
  }

  if (lastError) {
    throw new Error(
      `❌ [${app.name}] Failed to setup account after ${maxRetries} attempts: ${lastError}`,
    );
  }

  await removeSpeculos(isRemoteIos() && entry.runId ? entry.runId : entry.speculosPort);
}

// Execute commands for each app with retry mechanism
async function executeCliCommandsOnApp(
  uniqueOnApp: Array<{ app: SpeculosAppType; cmd: CliCommand }>,
  entryMap: Record<string, Entry>,
  userdataPath: string,
): Promise<void> {
  for (const { app, cmd } of uniqueOnApp) {
    await executeAppCommandWithRetry(app, cmd, entryMap, userdataPath);
  }
}

// Single attempt to setup main Speculos app
async function setupMainSpeculosAttempt(
  speculosApp: SpeculosAppType,
  entry: Entry,
  attempt: number,
  maxRetries: number,
): Promise<boolean> {
  log.info(`\n🔄 [${speculosApp.name}] Main setup attempt ${attempt}/${maxRetries}`);

  try {
    await waitForSpeculosIfRemote(entry);
    await registerSpeculos(entry.speculosPort, entry.proxyPort);
    log.info(
      `✅ [${speculosApp.name}] Main Speculos registered successfully on port ${entry.speculosPort}`,
    );
    return true;
  } catch (err) {
    log.warn(`⚠️ [${speculosApp.name}] Main setup attempt ${attempt} failed:`, err);
    throw err;
  }
}

// Retry logic for main Speculos app setup with instance recreation
async function setupMainSpeculosApp(
  speculosApp: SpeculosAppType,
  entryMap: Record<string, Entry>,
): Promise<void> {
  let main = entryMap[speculosApp.name];
  if (!main) {
    throw new Error(`No entry found for main speculos app: ${speculosApp.name}`);
  }

  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    attempt++;

    try {
      const success = await setupMainSpeculosAttempt(speculosApp, main, attempt, maxRetries);

      if (success) {
        lastError = undefined;
        break;
      }
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        log.info(`[${speculosApp.name}] Creating new main Speculos instance for retry`);

        // Clean up failed instance and create fresh one
        await removeSpeculos(isRemoteIos() && main.runId ? main.runId : main.speculosPort);

        main = await createNewSpeculosInstance(speculosApp, main);
        entryMap[speculosApp.name] = main;
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
async function executeCliCommands(
  cliCommands: CliCommand[],
  userdataPath: string,
  speculosApp?: SpeculosAppType,
  entryMap?: Record<string, Entry>,
): Promise<void> {
  for (const cmd of cliCommands) {
    // Wait for main Speculos if needed for global commands
    if (speculosApp && isRemoteIos() && entryMap) {
      const main = entryMap[speculosApp.name];
      if (main?.runId) {
        await waitForSpeculosReady(getSpeculosAddress(main.runId));
      }
    }

    await executeCliCommand(() => cmd(userdataPath));
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
    const speculosDevices = await setupSpeculosDevices(appsToLaunch);

    // Execute app-specific commands with retry logic
    await executeCliCommandsOnApp(uniqueOnApp, speculosDevices, userdataPath);

    // Setup main Speculos app if specified
    if (speculosApp) {
      await setupMainSpeculosApp(speculosApp, speculosDevices);
      const mainEntry = speculosDevices[speculosApp.name];
      log.info(
        `✅ Main Speculos app [${speculosApp.name}] setup complete. Port: ${mainEntry.speculosPort}, RunId: ${mainEntry.runId || "N/A"}`,
      );
    }

    // Execute global commands and finalize setup
    await executeCliCommands(cliCommands, userdataPath, speculosApp, speculosDevices);
    await loadConfig(userdataSpeculos, true);
    if (featureFlags) await setFeatureFlags(featureFlags);
  }
}
