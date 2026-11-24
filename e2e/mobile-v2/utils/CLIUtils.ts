import type { SpeculosAppType } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { SpeculosUtils, type Entry } from "@e2e-mobile/utils/SpeculosUtils";
import { waitForSpeculosReady } from "@ledgerhq/live-e2e-shared/speculosCI";

import { isObservable, Observable, lastValueFrom } from "rxjs";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";

import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";
import {
  registerTransportModule,
  unregisterAllTransportModules,
} from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";

import logger from "@wdio/logger";

const cliUtilsLogger = logger("CLI Utils");

export type CliCommand = (
  userdataPath?: string,
  speculosAddress?: string,
) => Observable<unknown> | Promise<unknown> | string;

export class CLIUtils {
  static executeCliCommandsOnApp = async (
    commandsByApp: Array<{ app: SpeculosAppType; cmds: CliCommand[] }>,
    entryMap: Record<string, Entry>,
    userdataPath: string,
    mainApp?: SpeculosAppType,
  ): Promise<void> => {
    // Execute commands for each app with retry mechanism
    for (const { app, cmds } of commandsByApp) {
      const entry = entryMap[app.name];
      if (!entry) {
        throw new Error(`No entry found for app: ${app.name}`);
      }

      const maxRetries = 3;
      let attempt = 0;
      let lastError: unknown;

      while (attempt < maxRetries) {
        // checkTestFailed(); TODO: REVIEW
        attempt++;

        try {
          const { speculosPort, deviceId } = entry;

          cliUtilsLogger.info(
            `\n🔄 [${app.name}] Attempt ${attempt}/${maxRetries} - Running ${cmds.length} command(s)`,
          );

          if (SpeculosUtils.isSpeculosRemote()) {
            await waitForSpeculosReady(entry.deviceId);
          }
          await SpeculosUtils.registerSpeculos(speculosPort);

          for (let i = 0; i < cmds.length; i++) {
            cliUtilsLogger.info(`📝 [${app.name}] Executing command ${i + 1}/${cmds.length}`);
            await CLIUtils.executeCliCommand(cmds[i], userdataPath, deviceId);
          }

          lastError = undefined;
          cliUtilsLogger.info(
            `✅ [${app.name}] All ${cmds.length} command(s) executed successfully on attempt ${attempt}`,
          );
          break;
        } catch (err) {
          lastError = err;

          if (attempt < maxRetries) {
            // checkTestFailed(); TODO: REVIEW

            // Create fresh instance for next retry attempt
            await SpeculosUtils.deleteSpeculos(entry.deviceId);
            const device = await SpeculosUtils.launchSpeculos(app.name);

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
        await SpeculosUtils.deleteSpeculos(entry.deviceId);
      }
    }
  };

  static registerSpeculosTransport = (apiPort: string, speculosAddress = "http://localhost") => {
    unregisterAllTransportModules();
    const req: SpeculosHttpTransportOpts = {
      apiPort: apiPort,
      baseURL: speculosAddress,
    };

    registerTransportModule({
      id: "speculos-http",
      open: () => retry(() => DeviceManagementKitTransportSpeculos.open(req)),
      disconnect: () => Promise.resolve(),
    });
  };

  static executeCliCommand = async (
    cmd: CliCommand,
    userdataPath?: string,
    speculosAddress?: string,
  ): Promise<unknown> => {
    const resultOrPromise = await cmd(userdataPath, speculosAddress);

    let result: unknown;
    try {
      if (isObservable(resultOrPromise)) {
        result = await lastValueFrom(resultOrPromise);
      } else {
        result = resultOrPromise;
      }
    } catch (error) {
      cliUtilsLogger.error("[CLI] ❌ Error executing command:", sanitizeError(error));
      throw sanitizeError(error);
    }

    cliUtilsLogger.info("[CLI] 🎉 Final result:", result);
    return result;
  };

  // Execute global commands after all app-specific setup is complete
  // On any failure (after per-command retries), delete and re-setup the main Speculos app
  // and restart the full set of commands from the beginning.
  static executeCliCommands = async (
    cliCommands: CliCommand[],
    userdataPath: string,
    speculosApp?: SpeculosAppType,
    entryMap?: Record<string, Entry>,
  ): Promise<void> => {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      // checkTestFailed(); TODO: REVIEW
      attempt++;
      cliUtilsLogger.info(`\n🔄 [Global CLI] Attempt ${attempt}/${maxRetries}`);
      try {
        for (const cmd of cliCommands) {
          await CLIUtils.executeCliCommand(() => cmd(userdataPath));
        }
        lastError = undefined;
        cliUtilsLogger.info(`✅ [Global CLI] Full run succeeded on attempt ${attempt}`);
        break;
      } catch (err) {
        lastError = err;

        if (speculosApp && entryMap) {
          // checkTestFailed(); TODO: REVIEW

          const main = entryMap[speculosApp.name];

          await SpeculosUtils.removeSpeculosAndDeregisterKnownSpeculos(main.deviceId);
          const device = await SpeculosUtils.launchSpeculos(speculosApp.name);
          entryMap[speculosApp.name] = {
            name: speculosApp.name,
            speculosPort: device.port,
            deviceId: device.id,
          };
          await SpeculosUtils.setupMainSpeculosApp(speculosApp, entryMap);
        }

        if (attempt < maxRetries) {
          cliUtilsLogger.warn(
            `[Global CLI] Retrying full command run (attempt ${attempt + 1}/${maxRetries})`,
          );
        }
      }
    }

    if (lastError) {
      throw new Error(
        `❌ [Global CLI] Full run failed after ${maxRetries} attempts (with Speculos re-setup): ${sanitizeError(lastError)}`,
      );
    }
  };
}

export default CLIUtils;
