import { ZodType, z } from "zod";
import { CloudSyncSDKInterface, MemberCredentials, Trustchain } from "@shared/cloud-sync";
import { WalletSyncDataManager } from "@shared/wallet-sync";

export type WatchConfig = {
  notificationsEnabled?: boolean;
  pollingInterval?: number;
  initialTimeout?: number;
  userIntentDebounce?: number;
};

export type VisualConfig = {
  visualPendingTimeout: number;
};

export type CreateWalletSyncWatchLoopParams<
  UserState,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> = {
  watchConfig?: WatchConfig;
  visualConfig?: VisualConfig;
  walletsync: WalletSyncDataManager<LocalState, Update, Schema>;
  walletSyncSdk: CloudSyncSDKInterface<DistantState>;
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
  setVisualPending?: (b: boolean) => void;
  onStartPolling?: () => void;
  onTrustchainRefreshNeeded: (trustchain: Trustchain) => Promise<void>;
  onError?: (e: unknown) => void;
  getState: () => UserState;
  localStateSelector: (state: UserState) => LocalState;
  latestDistantStateSelector: (state: UserState) => DistantState | null;
  localIncrementUpdate: () => Promise<void>;
  isTrustchainRefreshError: (e: unknown) => boolean;
};

export function createWalletSyncWatchLoop<UserState, LocalState, Update, Schema extends ZodType>({
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
  isTrustchainRefreshError,
}: CreateWalletSyncWatchLoopParams<UserState, LocalState, Update, Schema>): {
  onUserRefreshIntent: () => void;
  unsubscribe: () => void;
} {
  const visualPendingTimeout = visualConfig?.visualPendingTimeout || 1000;
  let unsubscribed = false;
  let pending = false;

  async function loop() {
    if (pending || unsubscribed) return;
    pending = true;
    const visualTimeout =
      setVisualPending && setTimeout(() => setVisualPending(true), visualPendingTimeout);
    try {
      if (onStartPolling) onStartPolling();
      await walletSyncSdk.pull(trustchain, memberCredentials);
      if (unsubscribed) return;
      await localIncrementUpdate();
      if (unsubscribed) return;
      const state = getState();
      const diff = walletsync.diffLocalToDistant(
        localStateSelector(state),
        latestDistantStateSelector(state),
      );
      if (diff.hasChanges) {
        await walletSyncSdk.push(trustchain, memberCredentials, diff.nextState);
      }
    } catch (e) {
      if (isTrustchainRefreshError(e)) {
        await onTrustchainRefreshNeeded(trustchain);
        return;
      }
      if (unsubscribed) return;
      if (onError) onError(e);
      else console.error(e);
    } finally {
      pending = false;
      if (visualTimeout) clearTimeout(visualTimeout);
      if (setVisualPending) setVisualPending(false);
    }
  }

  const notificationsEnabled = watchConfig?.notificationsEnabled || false;
  const pollingInterval = watchConfig?.pollingInterval || 10000;
  const initialTimeout = watchConfig?.initialTimeout || 1000;
  const userIntentDebounce = watchConfig?.userIntentDebounce || 1000;

  const callback = () => {
    timeout = setTimeout(callback, pollingInterval);
    loop();
  };
  let timeout = setTimeout(callback, initialTimeout);

  let notificationsSub: { unsubscribe: () => void } | null = null;
  if (notificationsEnabled) {
    notificationsSub = walletSyncSdk
      .listenNotifications(trustchain, memberCredentials)
      .subscribe(() => {
        loop();
      });
  }

  return {
    onUserRefreshIntent: () => {
      if (unsubscribed) return;
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
