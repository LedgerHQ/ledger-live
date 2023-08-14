// NOTE: this part connects WalletSync paradigm (@ledgerhq/wss-sdk) with BridgeSync paradigm.
// regardless of the conflict resolution implementation, "SYNC_WITH_WALLET_SYNC" message sent to the BridgeSync will trigger Accounts update.
import { WalletSyncClient } from "@ledgerhq/wss-sdk";
import { useEffect, useMemo } from "react";
import type {
  SyncAction,
  UnimportedAccountDescriptors,
  UpdatesQueue,
  WalletSyncInferredActions,
  WalletSyncPayload,
} from "./types";
import useEnv from "../../hooks/useEnv";
import { Account } from "@ledgerhq/types-live";
import { useThrottledFunction } from "../../hooks/useThrottledFunction";
import { AccountDescriptor, accountToAccountData } from "../../cross";
import { log } from "@ledgerhq/logs";
import { isEqual } from "lodash";
import { useDebounce } from "../../hooks/useDebounce";

export type VersionManager = {
  onVersionUpdate: (version: number) => void;
  getVersion: () => number | undefined;
};

/**
 * TODO: in future, .balance should disappear from AccountData and we won't need this clean up anymore
 */
function customAccountToAccountData(a: Account): AccountDescriptor {
  const data = accountToAccountData(a);
  delete data.balance;
  return data;
}

function accountDescriptorsDiff(
  before: WalletSyncPayload,
  after: WalletSyncPayload,
): WalletSyncInferredActions | undefined {
  const beforeById = {};
  const afterById = {};
  for (const descriptor of before) {
    beforeById[descriptor.id] = descriptor;
  }
  for (const descriptor of after) {
    afterById[descriptor.id] = descriptor;
  }
  const addedAccounts: AccountDescriptor[] = [];
  const removedAccounts: AccountDescriptor[] = [];
  const updatedAccounts: AccountDescriptor[] = [];
  for (const descriptor of after) {
    const old = beforeById[descriptor.id];
    if (!old) {
      addedAccounts.push(descriptor);
    } else if (old.name !== descriptor.name) {
      updatedAccounts.push(descriptor);
    }
  }
  for (const descriptor of before) {
    const old = afterById[descriptor.id];
    if (!old) {
      removedAccounts.push(descriptor);
    }
  }
  if (!addedAccounts.length && !removedAccounts.length && !updatedAccounts.length) return;
  return {
    addedAccounts,
    removedAccounts,
    updatedAccounts,
  };
}

function isSamePayload(before: WalletSyncPayload, after: WalletSyncPayload): boolean {
  const data = after.concat([]);
  // we need to stabilize the data order to avoid unnecessary diff (before is the server stable data)
  data.sort((a, b) => (a.id === b.id ? 0 : a.id < b.id ? -1 : 1));
  return isEqual(before, data);
}

// this hooks 'Wallet Sync' logic with BridgeSync paradigm

export function useWalletSync({
  accounts,
  sync,
  walletSyncAuth,
  walletSyncVersionManager,
  getLatestWalletSyncPayload,
  setLatestWalletSyncPayload,
  updatesQueue,
}: {
  accounts: Account[];
  sync: (action: SyncAction) => void;
  walletSyncAuth: string | undefined;
  walletSyncVersionManager: VersionManager;
  getLatestWalletSyncPayload: () => WalletSyncPayload | undefined;
  setLatestWalletSyncPayload: (payload: WalletSyncPayload) => void;
  updatesQueue: UpdatesQueue;
}): WalletSyncClient | null {
  const client = useClient(walletSyncAuth, walletSyncVersionManager);

  /////////////////////////////////////////////////////////////////////////////
  // { local Account[] <= server AccountDescriptor[] } updates reconciliation
  //
  // we determines the diff actions and apply them to the local accounts, and finally save the version locally to "commit" it
  //
  useEffect(() => {
    if (!client) return;

    // FIXME: at the moment, the present code creates backpressure on the syncbridge due to the polling implementation.
    // OPINION: this is the limit of observables. i think the SDK should provide another paradigm where we could have an "async job" that it would need to wait on

    const sub = client.observable().subscribe(([descriptors, version]) => {
      // from the local diff, we infer the actions to apply on the accounts[]
      const actions = accountDescriptorsDiff(getLatestWalletSyncPayload() || [], descriptors);
      if (!actions) {
        log("walletsync", "accounts=> received new version. no local diff");
        setLatestWalletSyncPayload(descriptors);
        walletSyncVersionManager.onVersionUpdate(version);
        return;
      }

      // this propagate to the bridge sync underlying logic the intent of wallet sync and hook a way to save it back when it's ready
      sync({
        type: "SYNC_WITH_WALLET_SYNC",
        actions,
        // FIXME: we want this to be done atomic instead. there should be just one redux action to save once the version and the descriptor!
        onSuccess: (_unimported: UnimportedAccountDescriptors) => {
          setLatestWalletSyncPayload(descriptors);
          walletSyncVersionManager.onVersionUpdate(version);
        },
      });
    });

    client.start();

    return () => {
      sub.unsubscribe();
      client.stop();
    };
  }, [
    client,
    sync,
    getLatestWalletSyncPayload,
    setLatestWalletSyncPayload,
    walletSyncVersionManager,
  ]);

  ///////////////////////////////////////////////////////////////////
  // { local Account[] => server AccountDescriptor[] } data reconciliation
  // we determine the current descriptors and push it to the server when necessary (when it changed)
  //
  const delay = useEnv("WALLET_SYNC_PUSH_DEBOUNCE");
  let update = useThrottledFunction<
    [] | [string] | [string, WalletSyncPayload],
    [typeof client, typeof accounts, typeof getLatestWalletSyncPayload, typeof updatesQueue]
  >(
    (client, accounts, getLatestWalletSyncPayload, updatesQueue) => {
      if (!client || !updatesQueue || !accounts || !getLatestWalletSyncPayload) {
        return [];
      }

      // we cancel if there is a pending wallet sync. we will enter again once accounts[] change
      if (!updatesQueue.idle()) {
        return ["=>accounts: queue is busy"];
      }

      // from our local accounts state, we infer what would be the data to push
      const data = accounts.map(customAccountToAccountData);

      // FIXME NOT IMPLEMENTED: we need to also send back the descriptors that was not yet correctly imported
      /*
      if (unimported) {
        unimported.forEach(descriptor => {
          if (!data.find(d => d.id === descriptor.id)) {
            data.push(descriptor);
          }
        });
      }
      */

      const old = getLatestWalletSyncPayload();

      // we compare if the data has changed from the latest data available on server
      if (isSamePayload(old || [], data)) {
        return ["=>accounts: no local changes"];
      }

      return ["=>accounts: pushing " + data.length + " descriptors", data];
    },
    delay,
    [client, accounts, getLatestWalletSyncPayload, updatesQueue],
  );
  // on top of the throttling, we debounce a bit the update to avoid too much push to the server
  update = useDebounce(update, delay);

  // update have a debounced state of what should be pushed to server. we apply it here
  useEffect(() => {
    const [msg, data] = update;
    if (msg) log("walletsync", msg);
    if (data && client) client.saveData(data);
  }, [update, client]);

  return client;
}

// get the wallet sync client instance. null if the auth is not yet set
/**
 * TODO: in future, to make this independent of the 'Accounts' topic,
 * we will probably make this accessible from the "context".
 * But TBD how the wss-sdk will evolve to allow more than just /accounts
 */
function useClient(
  auth: string | undefined,
  versionManager: VersionManager,
): WalletSyncClient | null {
  const url = useEnv("WALLET_SYNC_API");
  const clientInfo = useEnv("LEDGER_CLIENT_VERSION");
  const pollFrequencyMs = useEnv("WALLET_SYNC_POLL_FREQUENCY");
  const client = useMemo(
    () =>
      auth
        ? new WalletSyncClient({ url, pollFrequencyMs, auth, clientInfo }, versionManager)
        : null,
    [url, auth, clientInfo, pollFrequencyMs, versionManager],
  );
  return client;
}
