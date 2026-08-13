import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CloudSyncSDK, type UpdateEvent } from "@shared/cloud-sync";
import { liveSlug } from "@features/platform-wallet-sync";
import {
  walletSyncSchema,
  type WalletSyncDistantState as LiveData,
} from "@ledgerhq/live-wallet/walletSyncComposition";
import { getEnv } from "@shared/env";
import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";
import { retry } from "@ledgerhq/live-common/promise";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
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
} from "@ledgerhq/live-e2e-shared/runCli";

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
  /**
   * Resolves the application path the backend currently accepts for a trustchain. Removing a
   * member rotates the application stream onto the next path (`sdk.removeMember`), which leaves
   * any locally cached `applicationPath` stale. The JWT permissions are the source of truth.
   */
  resolveApplicationPath: function (opts: LedgerKeyRingProtocolOpts): Promise<string | undefined> {
    const {
      apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING"),
      applicationId = 16,
      name = "CLI",
      pubKey,
      privateKey,
      rootId,
      walletSyncEncryptionKey,
    } = opts;

    if (!pubKey || !privateKey) return Promise.reject("pubKey and privateKey are required");
    if (!rootId) return Promise.reject("rootId is required");

    const sdk = getSdk(false, { applicationId, name, apiBaseUrl }, withDevice);

    return sdk
      .withAuth(
        { rootId, walletSyncEncryptionKey: walletSyncEncryptionKey ?? "", applicationPath: "" },
        { pubkey: pubKey, privatekey: privateKey },
        jwt => Promise.resolve(Object.keys(jwt.permissions?.[rootId] ?? {})),
        undefined,
        true,
      )
      .then(paths => paths.find(path => path.startsWith(`m/0'/${applicationId}'/`)) ?? paths[0]);
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
      schema: walletSyncSchema,
      trustchainSdk: ledgerKeyRingProtocolSDK,
      getCurrentVersion: () => version ?? 0,
      saveNewUpdate: async (event: UpdateEvent<LiveData>) => {
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
        .then((result: void) =>
          JSON.stringify({ result, updateEvent: latestUpdateEvent }, null, 2),
        );
    }

    if (push) {
      return cloudSyncSDK
        .push(
          { rootId, walletSyncEncryptionKey, applicationPath },
          { pubkey: pubKey, privatekey: privateKey },
          JSON.parse(data!) as LiveData,
        )
        .then((result: void) => JSON.stringify(result, null, 2));
    }
  },
  liveData: function (opts: LiveDataOpts) {
    return runCliLiveData(opts);
  },
  registerSpeculosTransport: function (apiPort: string, speculosAddress = "http://localhost") {
    const req: SpeculosHttpTransportOpts = {
      apiPort: apiPort,
      baseURL: speculosAddress,
    };

    registerTransportModule({
      id: "speculos-http-" + apiPort,
      open: () => retry(() => DeviceManagementKitTransportSpeculos.open(req)),
      disconnect: () => Promise.resolve(),
    });
  },
  getAddress: (opts: GetAddressOpts) => runCliGetAddress(opts),
  tokenApproval: function (opts: TokenApprovalOpts) {
    return runCliTokenApproval(opts);
  },
  getTokenAllowance: function (opts: GetTokenAllowanceOpts) {
    return runCliGetTokenAllowance(opts);
  },
};
