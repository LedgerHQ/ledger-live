import type { ZodType } from "zod";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import type { VisualConfig, WatchConfig, WatchLoopHandle } from "../watchLoop/types";

/**
 * Polls on a timer, and on notifications when enabled: each cycle pulls, applies the local
 * incremental update, then pushes the local diff. One cycle runs at a time.
 */
export function runWatchLoop<UserState, LocalState, Update, Schema extends ZodType, DistantState>({
  watchConfig,
  visualConfig,
  walletsync,
  transport,
  needsRefresh,
  onRefreshNeeded,
  setVisualPending,
  onStartPolling,
  onError,
  getState,
  localStateSelector,
  latestDistantStateSelector,
  localIncrementUpdate,
}: RunWatchLoopParams<UserState, LocalState, Update, Schema, DistantState>): WatchLoopHandle {
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
      await transport.pull();
      if (unsubscribed) return;
      await localIncrementUpdate();
      if (unsubscribed) return;
      const state = getState();
      const diff = walletsync.diffLocalToDistant(
        localStateSelector(state),
        latestDistantStateSelector(state),
      );
      if (diff.hasChanges) {
        await transport.push(diff.nextState);
      }
    } catch (e) {
      await handleCycleError(e);
    } finally {
      pending = false;
      if (visualTimeout) clearTimeout(visualTimeout);
      if (setVisualPending) setVisualPending(false);
    }
  }

  async function handleCycleError(e: unknown) {
    if (needsRefresh(e)) {
      await onRefreshNeeded();
      return;
    }
    if (unsubscribed) return;
    if (onError) onError(e);
    else console.error(e);
  }

  const notificationsEnabled = watchConfig?.notificationsEnabled || false;
  const pollingInterval = watchConfig?.pollingInterval || 10000;
  const initialTimeout = watchConfig?.initialTimeout || 1000;
  const userIntentDebounce = watchConfig?.userIntentDebounce || 1000;

  function poll() {
    timeout = setTimeout(poll, pollingInterval);
    void loop();
  }
  let timeout = setTimeout(poll, initialTimeout);

  let notificationsSub: { unsubscribe: () => void } | null = null;
  if (notificationsEnabled) {
    notificationsSub = transport.listenNotifications().subscribe(() => {
      void loop();
    });
  }

  return {
    onUserRefreshIntent() {
      if (unsubscribed) return;
      clearTimeout(timeout);
      timeout = setTimeout(poll, userIntentDebounce);
    },
    unsubscribe() {
      unsubscribed = true;
      clearTimeout(timeout);
      if (notificationsSub) notificationsSub.unsubscribe();
    },
  };
}

/** What one cycle needs from the Cloud Sync transport, whatever identifies the stream. */
export type WatchLoopTransport<DistantState> = {
  pull: () => Promise<void>;
  push: (nextState: DistantState) => Promise<void>;
  listenNotifications: () => { subscribe: (listener: () => void) => { unsubscribe: () => void } };
};

/** Options of `runWatchLoop`, whatever transport carries the cycles. */
export type RunWatchLoopParams<
  UserState,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState,
> = {
  watchConfig?: WatchConfig;
  visualConfig?: VisualConfig;
  walletsync: CloudSyncDataManager<LocalState, Update, Schema, DistantState>;
  transport: WatchLoopTransport<DistantState>;
  /** True when the error means the key changed or this instance left: the loop refreshes. */
  needsRefresh: (error: unknown) => boolean;
  onRefreshNeeded: () => Promise<void>;
  setVisualPending?: (b: boolean) => void;
  onStartPolling?: () => void;
  onError?: (e: unknown) => void;
  getState: () => UserState;
  localStateSelector: (state: UserState) => LocalState;
  latestDistantStateSelector: (state: UserState) => DistantState | null;
  localIncrementUpdate: () => Promise<void>;
};
