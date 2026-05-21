import type { SpeculosAppType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { SpeculosUtils, type Entry } from "./SpeculosUtils.ts";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";

import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { isObservable, Observable, lastValueFrom } from "rxjs";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { getEnv } from "@ledgerhq/live-env";
import { CloudSyncSDK, type UpdateEvent } from "@ledgerhq/live-wallet/cloudsync/index";
import { DistantState as LiveData, liveSlug } from "@ledgerhq/live-wallet/walletsync/index";
import walletsync from "@ledgerhq/live-wallet/walletsync/root";

import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";

import {
  runCliGetAddress,
  runCliGetTokenAllowance,
  runCliLiveData,
  runCliTokenApproval,
  type GetAddressOpts,
  type GetTokenAllowanceOpts,
  type LedgerKeyRingProtocolOpts,
  type LedgerSyncOpts,
  type LiveDataOpts,
  type TokenApprovalOpts,
} from "@ledgerhq/live-common/e2e/runCli";

import {
  registerTransportModule,
  unregisterAllTransportModules,
} from "@ledgerhq/live-common/hw/index";

import { retry } from "@ledgerhq/live-common/promise";

import LoggerUtils from "./LoggerUtils.ts";

const cliUtilsLogger = new LoggerUtils("CLI Utils");

export type CliCommand = (
  userdataPath?: string,
  speculosAddress?: string,
) => Observable<unknown> | Promise<unknown> | string;

export class CLIUtils {
  static liveData = (opts: LiveDataOpts) => runCliLiveData(opts);

  static getAddress = (opts: GetAddressOpts) => runCliGetAddress(opts);

  static tokenApproval = (opts: TokenApprovalOpts) => runCliTokenApproval(opts);

  static getTokenAllowance = (opts: GetTokenAllowanceOpts) => runCliGetTokenAllowance(opts);

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

  static ledgerKeyRingProtocol = async (opts: LedgerKeyRingProtocolOpts) => {
    const {
      apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING"),
      applicationId = 16,
      name = "CLI",
      initMemberCredentials,
      getKeyRingTree,
      pubKey,
      privateKey,
      device,
      destroyKeyRingTree,
      rootId,
      walletSyncEncryptionKey,
      applicationPath,
    } = opts;

    const context = {
      applicationId,
      name,
      apiBaseUrl,
    };

    const sdk = getSdk(false, context, withDevice);

    //@todo: Split into it's own function
    if (initMemberCredentials) {
      return sdk.initMemberCredentials();
    }

    //@todo: Split into it's own function
    if (getKeyRingTree) {
      if (!pubKey || !privateKey) {
        return Promise.reject("pubKey and privateKey are required");
      }

      const result_1 = await sdk.getOrCreateTrustchain(device || "", {
        pubkey: pubKey,
        privatekey: privateKey,
      });
      return result_1.trustchain;
    }

    if (destroyKeyRingTree) {
      if (!pubKey || !privateKey) return Promise.reject("pubKey and privateKey are required");
      if (!rootId) return Promise.reject("rootId is required");
      if (!walletSyncEncryptionKey) return Promise.reject("walletSyncEncryptionKey is required");
      if (!applicationPath) return Promise.reject("applicationPath is required");

      return sdk["destroyTrustchain"](
        { rootId, walletSyncEncryptionKey, applicationPath },
        { pubkey: pubKey, privatekey: privateKey },
      );
    }

    return Promise.reject("No function specified");
  };

  static ledgerSync = async (opts: LedgerSyncOpts) => {
    const {
      applicationId = 16,
      name = "CLI",
      apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING"),
      pubKey,
      privateKey,
      rootId,
      walletSyncEncryptionKey,
      applicationPath,
      push,
      pull,
      data,
      version,
      cloudSyncApiBaseUrl,
      deleteData,
    } = opts;
    const context = {
      applicationId,
      name,
      apiBaseUrl,
    };

    if (!cloudSyncApiBaseUrl) {
      return;
    }

    let latestUpdateEvent: UpdateEvent<LiveData> | null = null;
    const ledgerKeyRingProtocolSDK = getSdk(false, context, withDevice);

    const cloudSyncSDK = new CloudSyncSDK({
      apiBaseUrl: cloudSyncApiBaseUrl,
      slug: liveSlug,
      schema: walletsync.schema,
      trustchainSdk: ledgerKeyRingProtocolSDK,
      getCurrentVersion: () => version || 1,
      saveNewUpdate: async (event: UpdateEvent<LiveData>) => {
        latestUpdateEvent = event;
      },
    });

    //@todo: Split into it's own function
    if (push) {
      return cloudSyncSDK
        .push(
          { rootId, walletSyncEncryptionKey, applicationPath },
          { pubkey: pubKey, privatekey: privateKey },
          JSON.parse(data!) as LiveData,
        )
        .then((result: void) => JSON.stringify(result, null, 2));
    }

    //@todo: Split into it's own function
    if (pull) {
      return cloudSyncSDK
        .pull(
          { rootId, walletSyncEncryptionKey, applicationPath },
          { pubkey: pubKey, privatekey: privateKey },
        )
        .then((result: void) =>
          JSON.stringify({ result, updateEvent: latestUpdateEvent }, null, 2),
        );
    }

    if (deleteData) {
      return cloudSyncSDK.destroy(
        { rootId, walletSyncEncryptionKey, applicationPath },
        { pubkey: pubKey, privatekey: privateKey },
      );
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
          cliUtilsLogger.info(
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
