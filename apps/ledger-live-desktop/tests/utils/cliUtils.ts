import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/lib/cloudsync/index";
import { DistantState as LiveData, liveSlug } from "@ledgerhq/live-wallet/lib/walletsync/index";
import walletsync from "@ledgerhq/live-wallet/lib/walletsync/root";
import { getEnv } from "@ledgerhq/live-env";
import { runCliCommand } from "./runCli";
import SpeculosHttpTransport, {
  SpeculosHttpTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos-http";
import { retry } from "@ledgerhq/live-common/promise";
import {
  registerTransportModule,
  unregisterTransportModule,
} from "@ledgerhq/live-common/lib/hw/index";

type LiveDataOpts = {
  currency: string;
  index: number | undefined;
  appjson: string | undefined;
  add: boolean;
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
  },
  liveData: function (opts: LiveDataOpts) {
    const cliOpts = ["liveData"];

    if (opts.currency) {
      cliOpts.push(`--currency ${opts.currency}`);
    }

    if (opts.index !== undefined) {
      cliOpts.push(`--index ${opts.index}`);
    }

    if (opts.appjson) {
      cliOpts.push(`--appjson ${opts.appjson}`);
    }

    if (opts.add) {
      cliOpts.push("--add");
    }

    return runCliCommand(cliOpts.join(" "));
  },
  registerSpeculosTransport: function (apiPort: number) {
    unregisterTransportModule("hid");
    const req: Record<string, number> = {
      apiPort: apiPort,
    };

    registerTransportModule({
      id: "speculos-http",
      open: () => retry(() => SpeculosHttpTransport.open(req as SpeculosHttpTransportOpts)),
      disconnect: () => Promise.resolve(),
    });
  },
};
