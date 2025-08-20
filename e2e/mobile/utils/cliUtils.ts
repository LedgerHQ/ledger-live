import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/lib/cloudsync/index";
import { DistantState as LiveData, liveSlug } from "@ledgerhq/live-wallet/lib/walletsync/index";
import walletsync from "@ledgerhq/live-wallet/lib/walletsync/root";
import { getEnv } from "@ledgerhq/live-env";
import { runCliCommandWithRetry } from "./runCli";
import {
  registerTransportModule,
  unregisterAllTransportModules,
} from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import SpeculosHttpTransport, {
  SpeculosHttpTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos-http";
import { isRemoteIos } from "../helpers/commonHelpers";

export type LiveDataOpts = {
  currency: string;
  index?: number;
  scheme?: string;
  appjson?: string;
  add?: boolean;
};

type LedgerKeyRingProtocolOpts = {
  initMemberCredentials?: boolean;
  apiBaseUrl?: string;
  applicationId?: number;
  name?: string;
  getKeyRingTree?: boolean;
  pubKey?: string;
  privateKey?: string;
  device?: string;
  destroyKeyRingTree?: boolean;
  rootId?: string;
  walletSyncEncryptionKey?: string;
  applicationPath?: string;
};

type LedgerSyncOpts = {
  applicationId?: number;
  name?: string;
  apiBaseUrl?: string;
  pubKey: string;
  privateKey: string;
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
  push?: boolean;
  pull?: boolean;
  data?: string;
  version?: number;
  cloudSyncApiBaseUrl?: string;
  deleteData?: boolean;
};

export const CLI = {
  ledgerKeyRingProtocol: async function (opts: LedgerKeyRingProtocolOpts) {
    console.error("[CLI] 🔄 Starting ledgerKeyRingProtocol function");
    console.error("[CLI] 📋 Options received:", JSON.stringify(opts, null, 2));
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

    console.error(`[CLI] 🏗️ Context created:`, context);

    console.error("[CLI] 🔄 Getting SDK with device access");
    const sdk = getSdk(false, context, withDevice);
    console.error("[CLI] ✅ SDK created successfully");

    //@todo: Split into it's own function
    if (initMemberCredentials) {
      console.error("[CLI] 🔄 Executing initMemberCredentials operation");
      return sdk.initMemberCredentials();
    }

    //@todo: Split into it's own function
    if (getKeyRingTree) {
      console.error("[CLI] 🔄 Executing getKeyRingTree operation");
      if (!pubKey || !privateKey) {
        return Promise.reject("pubKey and privateKey are required");
      }

      const result_1 = await sdk.getOrCreateTrustchain(device || "", {
        pubkey: pubKey,
        privatekey: privateKey,
      });
      console.error("[CLI] ✅ getKeyRingTree completed successfully");
      console.error(`[CLI] 📊 Trustchain result:`, result_1);
      return result_1.trustchain;
    }

    if (destroyKeyRingTree) {
      console.error("[CLI] 🔄 Executing destroyKeyRingTree operation");

      if (!pubKey || !privateKey) return Promise.reject("pubKey and privateKey are required");
      if (!rootId) return Promise.reject("rootId is required");
      if (!walletSyncEncryptionKey) return Promise.reject("walletSyncEncryptionKey is required");
      if (!applicationPath) return Promise.reject("applicationPath is required");

      console.error("[CLI] ✅ destroyKeyRingTree completed successfully");
      return sdk["destroyTrustchain"](
        { rootId, walletSyncEncryptionKey, applicationPath },
        { pubkey: pubKey, privatekey: privateKey },
      );
    }

    return Promise.reject("No function specified");
  },
  ledgerSync: function (opts: LedgerSyncOpts) {
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

    console.error(`[CLI] 🏗️ Context created:`, context);
    if (!cloudSyncApiBaseUrl) {
      return;
    }

    console.error("[CLI] 🔄 Getting SDK with device access");
    let latestUpdateEvent: UpdateEvent<LiveData> | null = null;
    const ledgerKeyRingProtocolSDK = getSdk(false, context, withDevice);

    console.error("[CLI] 🔄 Creating CloudSyncSDK");
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
      console.error("[CLI] 🔄 Executing PUSH operation");
      console.error(`[CLI] 📤 Push data:`, {
        rootId,
        walletSyncEncryptionKey,
        applicationPath,
      });
      console.error(`[CLI] 🔑 Credentials:`, {
        pubkey: pubKey ? `${pubKey.substring(0, 10)}...` : "undefined",
        privatekey: privateKey ? `${privateKey.substring(0, 10)}...` : "undefined",
      });
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
      console.error("[CLI] 🔄 Executing PULL operation");
      console.error(`[CLI] 📥 Pull params:`, {
        rootId,
        walletSyncEncryptionKey,
        applicationPath,
      });
      console.error(`[CLI] 🔑 Credentials:`, {
        pubkey: pubKey ? `${pubKey.substring(0, 10)}...` : "undefined",
        privatekey: privateKey ? `${privateKey.substring(0, 10)}...` : "undefined",
      });
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
      console.error("[CLI] 🔄 Executing DELETE operation");
      console.error(`[CLI] 🗑️ Delete params:`, {
        rootId,
        walletSyncEncryptionKey,
        applicationPath,
      });
      return cloudSyncSDK.destroy(
        { rootId, walletSyncEncryptionKey, applicationPath },
        { pubkey: pubKey, privatekey: privateKey },
      );
    }
  },
  liveData: function (opts: LiveDataOpts) {
    const cliOpts = ["liveData"];

    if (opts.currency) {
      cliOpts.push(`--currency+${opts.currency}`);
    }

    if (opts.index !== undefined) {
      cliOpts.push(`--index+${opts.index}`);
    }

    if (opts.appjson) {
      cliOpts.push(`--appjson+${opts.appjson}`);
    }

    if (opts.scheme) {
      cliOpts.push(`--scheme+${opts.scheme}`);
    }

    if (opts.add) {
      cliOpts.push("--add");
    }

    return runCliCommandWithRetry(cliOpts.join("+"), 5, isRemoteIos() ? 5_000 : 2_000);
  },
  registerSpeculosTransport: function (apiPort: string, speculosAddress = "http://localhost") {
    unregisterAllTransportModules();
    const req: SpeculosHttpTransportOpts = {
      apiPort: apiPort,
      baseURL: speculosAddress,
    };

    registerTransportModule({
      id: "speculos-http",
      open: () => retry(() => SpeculosHttpTransport.open(req)),
      disconnect: () => Promise.resolve(),
    });
  },
};
