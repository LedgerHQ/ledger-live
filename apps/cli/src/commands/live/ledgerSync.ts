import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/cloudsync/index";
import walletsync, {
  liveSlug,
  DistantState as LiveData,
} from "@ledgerhq/live-wallet/walletsync/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getEnv } from "@ledgerhq/live-env";

export type LedgerSyncJobOpts = Partial<{
  push: boolean;
  pull: boolean;
  pubKey: string;
  privateKey: string;
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
  data: string;
  version: number;
  applicationId?: number;
  name?: string;
  apiBaseUrl?: string;
  cloudSyncApiBaseUrl?: string;
}>;

export default {
  description: "Ledger Sync command",
  args: [
    {
      name: "push",
      type: Boolean,
      desc: "Init member credentials for Ledger Key Ring Protocol",
    },
    {
      name: "pull",
      type: Boolean,
      desc: "Get or create a Ledger Key Ring Protocol Tree",
    },
    {
      name: "pubKey",
      type: String,
      desc: "pubkey for Ledger Key Ring Protocol Tree retrieved from initMemberCredentials result",
    },
    {
      name: "privateKey",
      type: String,
      desc: "privatekey for Ledger Key Ring Protocol Tree retrieved from initMemberCredentials result",
    },
    {
      name: "rootId",
      type: String,
      desc: "The immutable id of the Tree root retrieved from getKeyRingTree result",
    },
    {
      name: "walletSyncEncryptionKey",
      type: String,
      desc: "The secret used to encrypt/decrypt the wallet sync data retrieved from getKeyRingTree result",
    },
    {
      name: "applicationPath",
      type: String,
      desc: "privatekey for Ledger Key Ring Protocol Tree from initMemberCredentials result",
    },
    {
      name: "data",
      type: String,
      desc: "data to be pushed to Ledger Sync",
    },
    {
      name: "version",
      type: Number,
      desc: "version of the data",
    },
    {
      name: "applicationId",
      type: Number,
      default: 16,
      desc: "application identifier",
    },
    {
      name: "name",
      type: String,
      default: "CLI",
      desc: "name of the instance",
    },
    {
      name: "apiBaseUrl",
      type: String,
      default: getEnv("TRUSTCHAIN_API_STAGING"),
      desc: "api base url for Ledger Key Ring Protocol",
    },
    {
      name: "cloudSyncApiBaseUrl",
      type: String,
      default: getEnv("CLOUD_SYNC_API_STAGING"),
      desc: "api base url for Cloud Sync",
    },
  ],
  job: ({
    push,
    pull,
    pubKey,
    privateKey,
    rootId,
    walletSyncEncryptionKey,
    applicationPath,
    data,
    version,
    applicationId = 16,
    name = "CLI",
    apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING"),
    cloudSyncApiBaseUrl = getEnv("CLOUD_SYNC_API_STAGING"),
  }: LedgerSyncJobOpts) => {
    if (!applicationId) return "applicationId is required";
    if (!name) return "name is required";
    if (!apiBaseUrl) return "apiBaseUrl is required";
    if (!pubKey || !privateKey) return "pubKey and privateKey are required";
    if (!rootId) return "pubKey and privateKey are required";
    if (!walletSyncEncryptionKey) return "walletSyncEncryptionKey is required";
    if (!applicationPath) return "applicationPath is required";
    if (push && !data) return "data is required";

    const context = {
      applicationId,
      name,
      apiBaseUrl,
    };
    const ledgerKeyRingProtocolSDK = getSdk(false, context, withDevice);

    const cloudSyncSDK = new CloudSyncSDK({
      apiBaseUrl: cloudSyncApiBaseUrl,
      slug: liveSlug,
      schema: walletsync.schema,
      trustchainSdk: ledgerKeyRingProtocolSDK,
      getCurrentVersion: () => version || 1,
      saveNewUpdate: async (event: UpdateEvent<LiveData>) => {
        console.log(event);
      },
    });

    if (push) {
      return cloudSyncSDK
        .push(
          { rootId, walletSyncEncryptionKey, applicationPath },
          { pubkey: pubKey, privatekey: privateKey },
          JSON.parse(data!) as LiveData,
        )
        .then(result => JSON.stringify(result, null, 2));
    }

    if (pull) {
      return cloudSyncSDK
        .pull(
          { rootId, walletSyncEncryptionKey, applicationPath },
          { pubkey: pubKey, privatekey: privateKey },
        )
        .then(result => JSON.stringify(result, null, 2));
    }

    return "command does not exist";
  },
};
