import fs from "fs";
import { toAccountRaw } from "@ledgerhq/live-common/account";
import { Account, type AccountRaw } from "@ledgerhq/types-live";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/lib/cloudsync";
import { DistantState as LiveData, liveSlug } from "@ledgerhq/live-wallet/lib/walletsync";
import walletsync from "@ledgerhq/live-wallet/lib/walletsync/root";
import { of } from "rxjs";

type LiveDataOpts = {
  currency: string;
  index: number | undefined;
  appjson: string | undefined;
  add: boolean;
};

type LedgerKeyRingProtocolOpts = {
  initMemberCredentials?: boolean;
  apiBaseUrl: string;
  applicationId: number;
  name: string;
  getKeyRingTree?: boolean;
  pubKey?: string;
  privateKey?: string;
  device?: string;
};

type LedgerSyncOpts = {
  applicationId: number;
  name: string;
  apiBaseUrl: string;
  pubKey: string;
  privateKey: string;
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
  push: boolean;
  pull: boolean;
  data?: string;
  version?: number;
  cloudSyncApiBaseUrl?: string;
};

type AppJsonSchema = {
  data: {
    accounts: AccountRaw[];
  };
};

export const CLI = {
  ledgerKeyRingProtocol: function (opts: LedgerKeyRingProtocolOpts) {
    const {
      apiBaseUrl,
      applicationId,
      name,
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
  },
  ledgerSync: function (opts: LedgerSyncOpts) {
    const {
      applicationId,
      name,
      apiBaseUrl,
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
    const appjsondata = opts.appjson
      ? JSON.parse(fs.readFileSync(opts.appjson, "utf-8"))
      : ({
          data: {
            accounts: [],
          },
        } as AppJsonSchema);

    const existingIds = appjsondata.data.accounts.map((a: AccountRaw) => a.data.id);

    const append = accounts
      .filter((a: Account) => !existingIds.includes(a.id))
      .map((account: Account) => ({
        data: toAccountRaw(account),
        version: 1,
      }));
    appjsondata.data.accounts = appjsondata.data.accounts.concat(append);

    if (opts.appjson) {
      fs.writeFileSync(opts.appjson, JSON.stringify(appjsondata), "utf-8");
      return of(append.length + " accounts added.");
    } else {
      return of(JSON.stringify(appjsondata));
    }
  },
};
