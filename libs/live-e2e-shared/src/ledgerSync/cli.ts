import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CloudSyncSDK, type UpdateEvent } from "@shared/cloud-sync";
import { liveSlug } from "@features/platform-wallet-sync";
import { isDistantDocument, type DistantDocument } from "@shared/cloud-sync-module";
import type { LedgerKeyRingProtocolOpts, LedgerSyncOpts } from "../runCli";
import { trustchainApiBaseUrl } from "./environment";
import { CLI_MEMBER_NAME } from "./testData";

const CREDENTIALS_REQUIRED = "pubKey and privateKey are required";

/** checked, not cast; not schema-validated so a suite can push a malformed slice on purpose */
export function parseDocumentArg(data: string): DistantDocument {
  const document: unknown = JSON.parse(data);
  if (!isDistantDocument(document)) throw new Error("ledgerSync: --data must be a JSON object");
  return document;
}

/**
 * Ledger Sync CLI entry points, shared by the desktop and mobile e2e suites. Unlike the other
 * `runCli*` helpers these do not spawn the CLI binary: they drive the SDKs in-process, reaching
 * Speculos through whichever transport module the caller registered.
 *
 * `apiBaseUrl` defaults to the resolved environment rather than a fixed one: it is the trustchain
 * that mints the JWT cloud-sync validates, so defaulting it independently of `cloudSyncApiBaseUrl`
 * would let a caller authenticate against one environment and call the other.
 */
export function ledgerKeyRingProtocol(opts: LedgerKeyRingProtocolOpts) {
  const {
    apiBaseUrl = trustchainApiBaseUrl,
    applicationId = 16,
    name = CLI_MEMBER_NAME,
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

  const sdk = getSdk(false, { applicationId, name, apiBaseUrl }, withDevice);

  if (initMemberCredentials) {
    return sdk.initMemberCredentials();
  }

  if (getKeyRingTree) {
    if (!pubKey || !privateKey) {
      return Promise.reject(new Error(CREDENTIALS_REQUIRED));
    }
    return sdk
      .getOrCreateTrustchain(device || "", { pubkey: pubKey, privatekey: privateKey })
      .then(result => result.trustchain);
  }

  if (destroyKeyRingTree) {
    if (!pubKey || !privateKey) return Promise.reject(new Error(CREDENTIALS_REQUIRED));
    if (!rootId) return Promise.reject(new Error("rootId is required"));
    if (!walletSyncEncryptionKey) {
      return Promise.reject(new Error("walletSyncEncryptionKey is required"));
    }
    if (!applicationPath) return Promise.reject(new Error("applicationPath is required"));

    return sdk["destroyTrustchain"](
      { rootId, walletSyncEncryptionKey, applicationPath },
      { pubkey: pubKey, privatekey: privateKey },
    );
  }

  return Promise.reject(new Error("No function specified"));
}

/**
 * Re-reads the trustchain the backend currently accepts. Removing a member rotates the application
 * stream onto the next path (`sdk.removeMember`), which leaves both a cached `applicationPath` and
 * the `walletSyncEncryptionKey` derived from it stale. Only `rootId` is read from the argument: the
 * SDK resolves the stream itself, so the other two fields can be whatever the caller last cached.
 */
export function restoreTrustchain(opts: LedgerKeyRingProtocolOpts) {
  const {
    apiBaseUrl = trustchainApiBaseUrl,
    applicationId = 16,
    name = "CLI",
    pubKey,
    privateKey,
    rootId,
    walletSyncEncryptionKey,
    applicationPath,
  } = opts;

  if (!pubKey || !privateKey) return Promise.reject(new Error(CREDENTIALS_REQUIRED));
  if (!rootId) return Promise.reject(new Error("rootId is required"));

  const sdk = getSdk(false, { applicationId, name, apiBaseUrl }, withDevice);

  return sdk.restoreTrustchain(
    {
      rootId,
      walletSyncEncryptionKey: walletSyncEncryptionKey ?? "",
      applicationPath: applicationPath ?? "",
    },
    { pubkey: pubKey, privatekey: privateKey },
  );
}

export function ledgerSync(opts: LedgerSyncOpts) {
  const {
    applicationId = 16,
    name = "CLI",
    apiBaseUrl = trustchainApiBaseUrl,
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

  if (!cloudSyncApiBaseUrl) {
    return;
  }

  let latestUpdateEvent: UpdateEvent<DistantDocument> | null = null;
  const ledgerKeyRingProtocolSDK = getSdk(false, { applicationId, name, apiBaseUrl }, withDevice);

  const cloudSyncSDK = new CloudSyncSDK({
    apiBaseUrl: cloudSyncApiBaseUrl,
    slug: liveSlug,
    trustchainSdk: ledgerKeyRingProtocolSDK,
    getCurrentVersion: () => version ?? 0,
    saveNewUpdate: async (event: UpdateEvent<DistantDocument>) => {
      latestUpdateEvent = event;
    },
  });

  // check deleteData/pull before push: callers reuse args that carry push: true
  if (deleteData) {
    return cloudSyncSDK.destroy(
      { rootId, walletSyncEncryptionKey, applicationPath },
      { pubkey: pubKey, privatekey: privateKey },
    );
  }

  if (pull) {
    return cloudSyncSDK
      .pull(
        { rootId, walletSyncEncryptionKey, applicationPath },
        { pubkey: pubKey, privatekey: privateKey },
      )
      .then((result: void) => JSON.stringify({ result, updateEvent: latestUpdateEvent }, null, 2));
  }

  if (push) {
    return cloudSyncSDK
      .push(
        { rootId, walletSyncEncryptionKey, applicationPath },
        { pubkey: pubKey, privatekey: privateKey },
        parseDocumentArg(data!),
      )
      .then((result: void) => JSON.stringify(result, null, 2));
  }
}
