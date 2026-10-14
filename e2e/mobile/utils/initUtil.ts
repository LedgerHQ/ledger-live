import { loadConfig, setFeatureFlags } from "@e2e/bridge/server";
import { isObservable, lastValueFrom, Observable } from "rxjs";
import { log } from "detox";
import { SpeculosAppType } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { getMergedFeatureFlags } from "@e2e/utils/featureFlagUtils";
import { isSpeculosRemote } from "@e2e/helpers/commonHelpers";
import {
  deleteSpeculos,
  launchSpeculos,
  registerKnownSpeculos,
  registerSpeculos,
  removeSpeculosAndDeregisterKnownSpeculos,
} from "@e2e/utils/speculosUtils";
import { waitForSpeculosReady } from "@ledgerhq/live-e2e-shared/speculosCI";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { TEST_TIMEOUT } from "@e2e/utils/timeouts";

import type { PartialFeatures } from "@shared/feature-flags";

const SPECULOS_SETUP_BUDGET_MS = TEST_TIMEOUT - 120_000;
const SPECULOS_READY_TIMEOUT_MS = 75_000;
const MIN_SPECULOS_READY_WAIT_MS = 30_000;

function checkTestFailed(): void {
  if (globalThis.IS_FAILED) {
    throw new Error("Test failed - aborting initialization to prevent orphaned Speculos instances");
  }
}

function hasRetryBudget(deadline: number): boolean {
  return deadline - Date.now() >= MIN_SPECULOS_READY_WAIT_MS;
}

// Also points SPECULOS_ADDRESS, read by registerSpeculos, at this instance.
async function waitForSpeculosWithinBudget(deviceId: string, deadline: number): Promise<void> {
  const remaining = Math.max(deadline - Date.now(), MIN_SPECULOS_READY_WAIT_MS);
  await waitForSpeculosReady(deviceId, {
    timeout: Math.min(SPECULOS_READY_TIMEOUT_MS, remaining),
  });
}

type CliCommand = ((
  userdataPath?: string,
  speculosAddress?: string,
) => Observable<unknown> | Promise<unknown> | string) & {
  canUseGeneratedUserdata?: () => boolean;
};

export let isMyWalletEnabled = false;

export type InitOptions = {
  speculosApp?: SpeculosAppType;
  cliCommands?: CliCommand[];
  cliCommandsOnApp?: {
    app: SpeculosAppType;
    cmd: CliCommand;
  }[];
  userdata?: string | null;
  testedCurrencies?: string[];
  featureFlags?: PartialFeatures;
  speculosForSetupOnly?: boolean;
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
        .map(err => sanitizeError(err))
        .join("; ")}`,
    );
  }

  return launched.reduce<Record<string, Entry>>((acc, entry) => {
    acc[entry.name] = entry;
    return acc;
  }, {});
}

async function waitForSpeculosDevicesReady(
  entryMap: Record<string, Entry>,
  deadline: number,
): Promise<void> {
  const results = await Promise.allSettled(
    Object.keys(entryMap).map(appName => waitForSpeculosDeviceReady(appName, entryMap, deadline)),
  );
  const failures = results.flatMap(result => (result.status === "rejected" ? [result.reason] : []));

  if (failures.length) {
    throw new Error(failures.map(err => sanitizeError(err)).join("; "));
  }
}

async function waitForSpeculosDeviceReady(
  appName: string,
  entryMap: Record<string, Entry>,
  deadline: number,
): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    checkTestFailed();
    attempt++;
    const { deviceId } = entryMap[appName];

    try {
      await waitForSpeculosWithinBudget(deviceId, deadline);
      return;
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries || !hasRetryBudget(deadline)) break;

      checkTestFailed();

      log.info(
        `[${appName}] Speculos not ready, replacing it (attempt ${attempt + 1}/${maxRetries})`,
      );
      await deleteSpeculos(deviceId);
      const device = await launchSpeculos(appName);

      entryMap[appName] = {
        name: appName,
        speculosPort: device.port,
        deviceId: device.id,
      };
    }
  }

  throw new Error(
    `❌ [${appName}] Speculos not ready after ${attempt} attempt(s): ${sanitizeError(lastError)}`,
  );
}

// Execute commands for each app with retry mechanism
async function executeCliCommandsOnApp(
  commandsByApp: Array<{ app: SpeculosAppType; cmds: CliCommand[] }>,
  entryMap: Record<string, Entry>,
  userdataPath: string,
  deadline: number,
  mainApp?: SpeculosAppType,
): Promise<void> {
  for (const { app, cmds } of commandsByApp) {
    if (!entryMap[app.name]) {
      throw new Error(`No entry found for app: ${app.name}`);
    }

    const maxRetries = 3;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      checkTestFailed();
      attempt++;
      const { speculosPort, deviceId } = entryMap[app.name];

      try {
        log.info(
          `\n🔄 [${app.name}] Attempt ${attempt}/${maxRetries} - Running ${cmds.length} command(s)`,
        );

        if (isSpeculosRemote()) await waitForSpeculosWithinBudget(deviceId, deadline);
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
        if (attempt >= maxRetries || !hasRetryBudget(deadline)) break;

        checkTestFailed();

        // Create fresh instance for next retry attempt
        await deleteSpeculos(deviceId);
        const device = await launchSpeculos(app.name);

        entryMap[app.name] = {
          name: app.name,
          speculosPort: device.port,
          deviceId: device.id,
        };
      }
    }

    if (lastError) {
      throw new Error(
        `❌ [${app.name}] Failed to setup account after ${attempt} attempt(s): ${sanitizeError(lastError)}`,
      );
    }

    if (mainApp?.name !== app.name) {
      await deleteSpeculos(entryMap[app.name].deviceId);
    }
  }
}

// Retry logic for main Speculos app setup with instance recreation
async function setupMainSpeculosApp(
  speculosApp: SpeculosAppType,
  entryMap: Record<string, Entry>,
  deadline: number,
): Promise<void> {
  if (!entryMap[speculosApp.name]) {
    throw new Error(`No entry found for main speculos app: ${speculosApp.name}`);
  }

  const maxRetries = 3;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    checkTestFailed();
    attempt++;
    const main = entryMap[speculosApp.name];

    try {
      log.info(`\n🔄 [${speculosApp.name}] Main setup attempt ${attempt}/${maxRetries}`);

      if (isSpeculosRemote()) {
        await waitForSpeculosWithinBudget(main.deviceId, deadline);
      }
      await registerSpeculos(main.speculosPort);
      await registerKnownSpeculos(main.speculosPort);
      log.info(
        `✅ [${speculosApp.name}] Main Speculos registered successfully on port ${main.speculosPort}`,
      );

      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries || !hasRetryBudget(deadline)) break;

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

  if (lastError) {
    throw new Error(
      `❌ [${speculosApp.name}] Failed to setup main Speculos app after ${attempt} attempt(s): ${sanitizeError(lastError)}`,
    );
  }
}

// Execute global commands after all app-specific setup is complete
// On any failure (after per-command retries), delete and re-setup the main Speculos app
// and restart the full set of commands from the beginning.
async function executeCliCommands(
  cliCommands: CliCommand[],
  userdataPath: string,
  deadline: number,
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
      if (attempt >= maxRetries || !hasRetryBudget(deadline)) break;

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
        await setupMainSpeculosApp(speculosApp, entryMap, deadline);
      }

      log.info(`[Global CLI] Retrying full command run (attempt ${attempt + 1}/${maxRetries})`);
    }
  }

  if (lastError) {
    throw new Error(
      `❌ [Global CLI] Full run failed after ${attempt} attempt(s) (with Speculos re-setup): ${sanitizeError(lastError)}`,
    );
  }
}

export class InitializationManager {
  static async initialize(
    options: InitOptions,
    userdataPath: string,
    userdataSpeculos: string,
  ): Promise<void> {
    const {
      speculosApp,
      cliCommands = [],
      cliCommandsOnApp = [],
      featureFlags = {},
      speculosForSetupOnly,
    } = options;
    const deadline = Date.now() + SPECULOS_SETUP_BUDGET_MS;

    await InitializationManager.setFeatureFlags(featureFlags);

    const skipSpeculos =
      !!speculosForSetupOnly &&
      cliCommandsOnApp.length === 0 &&
      cliCommands.length > 0 &&
      cliCommands.every(cmd => cmd.canUseGeneratedUserdata?.() ?? false);

    if (skipSpeculos) {
      await executeCliCommands(cliCommands, userdataPath, deadline);
      await InitializationManager.finalizeSetup(userdataSpeculos);
      return;
    }

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
    if (isSpeculosRemote()) await waitForSpeculosDevicesReady(speculosDevices, deadline);

    // Execute app-specific commands with retry logic
    await executeCliCommandsOnApp(
      commandsByApp,
      speculosDevices,
      userdataPath,
      deadline,
      speculosApp,
    );

    // Setup main Speculos app if specified
    if (speculosApp) {
      await setupMainSpeculosApp(speculosApp, speculosDevices, deadline);
      const mainEntry = speculosDevices[speculosApp.name];
      log.info(
        `✅ Main Speculos app [${speculosApp.name}] setup complete. Port: ${mainEntry.speculosPort}, Device: ${mainEntry.deviceId}`,
      );
    }

    // Execute global commands with internal full-run retry and Speculos re-initialization
    await executeCliCommands(cliCommands, userdataPath, deadline, speculosApp, speculosDevices);

    await InitializationManager.finalizeSetup(userdataSpeculos);
  }

  static async initializeFreshInstall(options: InitOptions): Promise<void> {
    const { speculosApp, cliCommands = [], cliCommandsOnApp = [], featureFlags = {} } = options;

    if (speculosApp || cliCommands.length > 0 || cliCommandsOnApp.length > 0) {
      throw new Error(
        "A fresh install has no userdata for Speculos or CLI commands to write into: pass a userdata fixture instead of null",
      );
    }

    await InitializationManager.setFeatureFlags(featureFlags);
  }

  private static async finalizeSetup(userdataSpeculos: string): Promise<void> {
    await loadConfig(userdataSpeculos, true);
  }

  static async setFeatureFlags(featureFlags: PartialFeatures) {
    const mergedFeatureFlags = getMergedFeatureFlags({ testFlags: featureFlags });
    const wallet40 = mergedFeatureFlags.lwmWallet40;
    isMyWalletEnabled = Boolean(wallet40?.enabled && wallet40?.params?.myWallet);

    globalThis.mergedFeatureFlags = mergedFeatureFlags;

    await setFeatureFlags(mergedFeatureFlags);
  }
}
