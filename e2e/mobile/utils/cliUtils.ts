import invariant from "invariant";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CloudSyncSDK, type UpdateEvent } from "@ledgerhq/live-wallet/cloudsync/index";
import { DistantState as LiveData, liveSlug } from "@ledgerhq/live-wallet/walletsync/index";
import walletsync from "@ledgerhq/live-wallet/walletsync/root";
import { getEnv } from "@ledgerhq/live-env";
import { runCliCommand, runCliCommandWithRetry } from "./runCli";
import {
  registerTransportModule,
  unregisterAllTransportModules,
} from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";
import {
  buildGetAddressCliCommand,
  buildGetTokenAllowanceCliCommand,
  buildLiveDataCliCommand,
  buildTokenApprovalCliCommand,
  parseGetAddressCliOutput,
  type GetAddressOpts,
  type GetTokenAllowanceOpts,
  type LedgerKeyRingProtocolOpts,
  type LedgerSyncOpts,
  type LiveDataOpts,
  type TokenApprovalOpts,
} from "@ledgerhq/live-common/e2e";
import { isSpeculosRemote } from "../helpers/commonHelpers";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export type { LiveDataOpts, GetAddressOpts, TokenApprovalOpts, GetTokenAllowanceOpts };

export const CLI = {
  ledgerKeyRingProtocol: async function (opts: LedgerKeyRingProtocolOpts) {
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
    return runCliCommandWithRetry(
      buildLiveDataCliCommand(opts),
      5,
      isSpeculosRemote() ? 5_000 : 2_000,
    );
  },
  registerSpeculosTransport: function (apiPort: string, speculosAddress = "http://localhost") {
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
  },
  getAddress: async (opts: GetAddressOpts) => {
    const output = await runCliCommand(buildGetAddressCliCommand(opts));
    return parseGetAddressCliOutput(output) as { address: string };
  },
  getAddressForAccount: async (account: Account) => {
    if (account.currency.id === Currency.HBAR.id) {
      invariant(account.address, "hedera: account address must be pre-set");
      return account.address;
    }

    const addressInfo = await CLI.getAddress({
      currency: account.currency.speculosApp.name,
      path: account.accountPath,
      derivationMode: account.derivationMode,
    });
    account.address = addressInfo.address;
    return addressInfo.address;
  },
  tokenApproval: function (opts: TokenApprovalOpts) {
    return runCliCommandWithRetry(buildTokenApprovalCliCommand(opts));
  },
  getTokenAllowance: function (opts: GetTokenAllowanceOpts) {
    return runCliCommandWithRetry(buildGetTokenAllowanceCliCommand(opts));
  },
};
