// Must exceed Body's SyncSkipUnderPriority(100); otherwise the await-delegation poll is dropped.
export const AWAIT_DELEGATION_SYNC_PRIORITY = 200;
export const AWAIT_DELEGATION_POLL_INTERVAL_MS = 5000;
export const MAX_AWAIT_DELEGATION_POLLS = 12;
