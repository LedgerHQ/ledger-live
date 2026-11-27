/** Timing of the watch loop. Every field is optional; the app feature flag usually carries it. */
export type WatchConfig = {
  /** Also runs a cycle on each Cloud Sync notification. Defaults to false. */
  notificationsEnabled?: boolean;
  /** Milliseconds between two polling cycles. Defaults to 10000. */
  pollingInterval?: number;
  /** Milliseconds before the first cycle. Defaults to 1000. */
  initialTimeout?: number;
  /** Milliseconds a user refresh intent waits before its cycle runs. Defaults to 1000. */
  userIntentDebounce?: number;
};

/** When the loop reports a cycle as visibly pending. */
export type VisualConfig = {
  /** Milliseconds a cycle runs before `setVisualPending(true)`. 0 falls back to 1000. */
  visualPendingTimeout: number;
};

/** A running watch loop. */
export type WatchLoopHandle = {
  /** Runs a cycle after the debounce delay instead of waiting for the next poll. */
  onUserRefreshIntent: () => void;
  /**
   * Stops polling and notifications. A cycle in flight stops at its next step, reporting no
   * error.
   */
  unsubscribe: () => void;
};
