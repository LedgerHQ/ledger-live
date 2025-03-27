import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/lib/cloudsync/index";
import { DistantState as LiveData, liveSlug } from "@ledgerhq/live-wallet/lib/walletsync/index";
import walletsync from "@ledgerhq/live-wallet/lib/walletsync/root";
import { getEnv } from "@ledgerhq/live-env";
import { runCliCommand } from "./runCli";
import createTransportHttp from "@ledgerhq/hw-transport-http";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";

type LiveDataOpts = {
  currency?: string;
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
  ledgerKeyRingProtocol: function (opts: LedgerKeyRingProtocolOpts) {
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
      return sdk
        .getOrCreateTrustchain(device || "", { pubkey: pubKey, privatekey: privateKey })
        .then(result => result.trustchain);
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

    return runCliCommand(cliOpts.join("+"));
  },
  registerProxyTransport: function (proxyUrl: string) {
    const Tr = createTransportHttp(proxyUrl);
    registerTransportModule({
      id: "http",
      open: () =>
        retry(() => Tr.create(3000, 5000), {
          context: "open-http-proxy",
        }),
      disconnect: () => Promise.resolve(),
    });
  },
};
