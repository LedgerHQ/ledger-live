import { ZodType, z } from "zod";
import { CloudSyncSDK } from "../cloudsync";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { WalletSyncDataManager } from "./types";
import { log } from "@ledgerhq/logs";

export type WatchConfig =
  | {
      type: "polling";
      pollingInterval: number;
    }
  | {
      type: "notifications";
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
  onError,
  getState,
  localStateSelector,
  latestDistantStateSelector,
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
}): {
  unsubscribe: () => void;
} {
  const visualPendingTimeout = visualConfig?.visualPendingTimeout || 1000;

  let unsubscribed = false;
  let pending = false;

  async function loop() {
    // skip if there is something already pending
    if (pending) return;
    pending = true;
    // when it's taking longer than expected, we will visualize the loading
    const visualTimeout =
      setVisualPending && setTimeout(() => setVisualPending(true), visualPendingTimeout);
    try {
      // check if there is a pull to do
      await walletSyncSdk.pull(trustchain, memberCredentials);
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

  if (watchConfig?.type === "notifications") {
    throw new Error("notifications not implemented yet");
  } else {
    const pollingInterval = watchConfig?.pollingInterval || 30000;
    const interval = setInterval(loop, pollingInterval);
    return {
      unsubscribe: () => {
        unsubscribed = true;
        clearInterval(interval);
      },
    };
  }
}
