import { ZodType, z } from "zod";
import { CloudSyncSDK } from "../cloudsync";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { WalletSyncDataManager } from "./types";
import { log } from "@ledgerhq/logs";
import { TrustchainEjected, TrustchainOutdated } from "@ledgerhq/trustchain/errors";
import { Subscription } from "rxjs";

export type WatchConfig = {
  notificationsEnabled?: boolean;
  pollingInterval?: number;
  initialTimeout?: number;
  userIntentDebounce?: number;
};

export type VisualConfig = {
  visualPendingTimeout: number;
};

/**
 * createWalletSyncWatchLoop is a helper to create a watch loop that will automatically sync the wallet with the cloud sync backend.
 * make sure to unsubscribe if you need to rerun a new watch loop. notably if one of the input changes.
 */
export function createWalletSyncWatchLoop<
  UserState,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
>({
  watchConfig,
  visualConfig,
  walletsync,
  walletSyncSdk,
  trustchain,
  memberCredentials,
  setVisualPending,
  onStartPolling,
  onTrustchainRefreshNeeded,
  onError,
  getState,
  localStateSelector,
  latestDistantStateSelector,
  localIncrementUpdate,
}: {
  /**
   * the configuration to use to watch for changes.
   */
  watchConfig?: WatchConfig;
  /**
   * the visual configuration to use to show a loading spinner when the sync is taking longer than expected.
   */
  visualConfig?: VisualConfig;
  /**
   * the wallet sync module used to manage the data.
   */
  walletsync: WalletSyncDataManager<LocalState, Update, Schema>;
  /**
   * the wallet sync sdk to use to interact with the cloud sync backend.
   */
  walletSyncSdk: CloudSyncSDK<Schema>;
  /**
   * the trustchain to use to authenticate with the cloud sync backend.
   */
  trustchain: Trustchain;
  /**
   * the member credentials to use to authenticate with the cloud sync backend.
   */
  memberCredentials: MemberCredentials;
  /**
   * imperatively set the visual pending state. This is useful to show a loading spinner when the sync is taking longer than expected.
   */
  setVisualPending?: (b: boolean) => void;
  /**
   * call at beginning of each polling loop
   */
  onStartPolling?: () => void;
  /*
   * called with the trustchain is possibly outdated.
   * a typical implementation is to call trustchainSdk.restoreTrustchain and update trustchain object.
   */
  onTrustchainRefreshNeeded: (trustchain: Trustchain) => Promise<void>;
  /**
   * imperatively inform of an error
   */
  onError?: (e: unknown) => void;
  /**
   * imperatively obtain the current global state of the application. if you are using redux, this is the store.getState() function.
   */
  getState: () => UserState;
  /**
   * from the global state, select all the "local state" that can then be provided to the walletsync module.
   * This is basically an aggregation of state that is relevant to the wallet sync modules.
   *  
   * Example:
 
   const localStateSelector = (state: State) => ({
      accounts: {
        list: state.accounts,
      },
      accountNames: state.walletState.accountNames,
    });
   */
  localStateSelector: (state: UserState) => LocalState;
  /**
   * yield the latest DistantState that was fetched from the cloud sync backend. It is normally stored by the walletsync/store.ts
   */
  latestDistantStateSelector: (state: UserState) => DistantState | null;
  /**
   * a function we need to regularly call to also resolve possible local state updates. (see incrementalUpdates.ts)
   */
  localIncrementUpdate: () => Promise<void>;
}): {
  onUserRefreshIntent: () => void;
  unsubscribe: () => void;
} {
  const visualPendingTimeout = visualConfig?.visualPendingTimeout || 1000;

  let unsubscribed = false;
  let pending = false;

  async function loop() {
    // skip if there is something already pending
    if (pending || unsubscribed) return;
    pending = true;
    // when it's taking longer than expected, we will visualize the loading
    const visualTimeout =
      setVisualPending && setTimeout(() => setVisualPending(true), visualPendingTimeout);
    try {
      log("walletsync", "loop");
      if (onStartPolling) onStartPolling();

      // check if there is a pull to do
      // TODO this needs to be called separately, probably more often than the rest of this logic.
      await walletSyncSdk.pull(trustchain, memberCredentials);
      if (unsubscribed) return;

      await localIncrementUpdate();
      if (unsubscribed) return;

      // is there new changes to push?
      const state = getState();
      const diff = walletsync.diffLocalToDistant(
        localStateSelector(state),
        latestDistantStateSelector(state),
      );

      if (diff.hasChanges) {
        log("walletsync", "local->dist diff to push", diff);
        // push the new changes
        await walletSyncSdk.push(trustchain, memberCredentials, diff.nextState);
      }
    } catch (e) {
      const shouldRefresh = e instanceof TrustchainEjected || e instanceof TrustchainOutdated;
      if (shouldRefresh) {
        await onTrustchainRefreshNeeded(trustchain);
        return;
      }
      if (unsubscribed) return;
      if (onError) onError(e);
      else {
        console.error(e);
      }
    } finally {
      pending = false;
      if (visualTimeout) clearTimeout(visualTimeout);
      if (setVisualPending) setVisualPending(false);
    }
  }

  const notificationsEnabled = watchConfig?.notificationsEnabled || false;
  const pollingInterval = watchConfig?.pollingInterval || 10000;
  const initialTimeout = watchConfig?.initialTimeout || 5000;
  const userIntentDebounce = watchConfig?.userIntentDebounce || 1000;

  // main loop
  const callback = () => {
    timeout = setTimeout(callback, pollingInterval);
    loop();
  };
  let timeout = setTimeout(callback, initialTimeout);

  let notificationsSub: Subscription | null = null;
  if (notificationsEnabled) {
    // minimal implementation that do not handle any retry in case the notification stream is lost.
    notificationsSub = walletSyncSdk
      .listenNotifications(trustchain, memberCredentials)
      .subscribe(() => {
        log("walletsync", "notification");
        loop();
      });
  }

  return {
    onUserRefreshIntent: () => {
      if (unsubscribed) return;
      // user intent will cancel the next loop call and reschedule one in a short time
      clearTimeout(timeout);
      timeout = setTimeout(callback, userIntentDebounce);
    },
    unsubscribe: () => {
      unsubscribed = true;
      clearInterval(timeout);
      if (notificationsSub) notificationsSub.unsubscribe();
    },
  };
}
