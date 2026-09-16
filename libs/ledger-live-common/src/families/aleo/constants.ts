// Encapsulate for LLD and LLM
export * from "@ledgerhq/coin-aleo/constants";

// UI only constants (desktop & mobile related)

export const PRIVATE_BALANCE_PLACEHOLDER = "***";
export const MANDATORY_SYNC_POLLING_DELAY = 3000;

/** Minimum time (ms) between progress state updates in the hook to avoid flooding React renders. */
export const PROGRESS_THROTTLE_INTERVAL_MS = 500;

/** How many syncs a settled unbonding is worth before we stop asking the bridge to catch up. */
export const MAX_UNBONDING_SYNC_ATTEMPTS = 3;
/** Below the 100 that device flows set with `SyncSkipUnderPriority`: never resync mid-signing. */
export const UNBONDING_SYNC_PRIORITY = 10;
