import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type LedgerKeyRingProtocolJobOpts = DeviceCommonOpts &
  Partial<{
    initMemberCredentials: boolean;
    getKeyRingTree: boolean;
    getMembers: boolean;
    encryptUserData: boolean;
    decryptUserData: boolean;
    restoreKeyRingTree: boolean;
    destroyKeyRingTree: boolean;
    pubKey: string;
    privateKey: string;
    rootId: string;
    walletSyncEncryptionKey: string;
    applicationPath: string;
    message: string;
    applicationId: number;
    name: string;
    apiBaseUrl: string;
  }>;

export default {
  description: "Ledger Key Ring Protocol command",
  args: [
    deviceOpt,
    {
      name: "initMemberCredentials",
      type: Boolean,
      desc: "Init member credentials for Ledger Key Ring Protocol",
    },
    {
      name: "getKeyRingTree",
      type: Boolean,
      desc: "Get or create a Ledger Key Ring Protocol Tree",
    },
    {
      name: "encryptUserData",
      type: Boolean,
      desc: "Encrypt user data with the current private key secured by the Ledger Key Ring Protocol",
    },
    {
      name: "decryptUserData",
      type: Boolean,
      desc: "Encrypt user data with the current private key secured by the Ledger Key Ring Protocol",
    },
    {
      name: "getMembers",
      type: Boolean,
      desc: "Get members of the Ledger Key Ring Protocol Tree",
    },
    {
      name: "restoreKeyRingTree",
      type: Boolean,
      desc: "Restore a Ledger Key Ring Protocol Tree",
    },
    {
      name: "destroyKeyRingTree",
      type: Boolean,
      desc: "Destroy a Ledger Key Ring Protocol Tree",
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
      name: "message",
      type: String,
      desc: "message to be encrypted/decrypted",
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
  ],
  job: ({
    device,
    initMemberCredentials,
    getKeyRingTree,
    encryptUserData,
    decryptUserData,
    getMembers,
    restoreKeyRingTree,
    destroyKeyRingTree,
    pubKey,
    privateKey,
    rootId,
    walletSyncEncryptionKey,
    applicationPath,
    message,
    applicationId = 16,
    name = "CLI",
    apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING"),
  }: LedgerKeyRingProtocolJobOpts) => {
    if (!applicationId) return "applicationId is required";
    if (!name) return "name is required";
    if (!apiBaseUrl) return "apiBaseUrl is required";

    const context = {
      applicationId,
      name,
      apiBaseUrl,
    };
    const sdk = getSdk(false, context, withDevice);

    if (initMemberCredentials) {
      return sdk.initMemberCredentials();
    }

    if (getKeyRingTree) {
      if (!pubKey || !privateKey) return "pubKey and privateKey are required";
      return sdk
        .getOrCreateTrustchain(device || "", { pubkey: pubKey, privatekey: privateKey })
        .then(result => result.trustchain);
    }

    if (getMembers || restoreKeyRingTree || destroyKeyRingTree) {
      if (!pubKey || !privateKey) return "pubKey and privateKey are required";
      if (!rootId) return "pubKey and privateKey are required";
      if (!walletSyncEncryptionKey) return "walletSyncEncryptionKey is required";
      if (!applicationPath) return "applicationPath is required";

      const sdkMethod = getMembers
        ? "getMembers"
        : restoreKeyRingTree
          ? "restoreTrustchain"
          : "destroyTrustchain";
      return sdk[sdkMethod](
        { rootId, walletSyncEncryptionKey, applicationPath },
        { pubkey: pubKey, privatekey: privateKey },
      );
    }

    if (encryptUserData || decryptUserData) {
      if (!rootId) return "rootId is required";
      if (!walletSyncEncryptionKey) return "walletSyncEncryptionKey is required";
      if (!applicationPath) return "applicationPath is required";
      if (!message) return "message is required";

      if (encryptUserData) {
        return sdk
          .encryptUserData(
            { rootId, walletSyncEncryptionKey, applicationPath },
            new TextEncoder().encode(message),
          )
          .then(array => Buffer.from(array).toString("hex"));
      }
      return sdk
        .decryptUserData(
          { rootId, walletSyncEncryptionKey, applicationPath },
          crypto.from_hex(message),
        )
        .then(array => new TextDecoder().decode(array));
    }

    return "command does not exist";
  },
};
