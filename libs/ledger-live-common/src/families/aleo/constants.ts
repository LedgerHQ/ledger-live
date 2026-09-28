// Encapsulate for LLD and LLM
export * from "@ledgerhq/coin-aleo/constants";

// UI only constants (desktop & mobile related)

export const PRIVATE_BALANCE_PLACEHOLDER = "***";
export const MANDATORY_SYNC_POLLING_DELAY = 3000;

/** Minimum time (ms) between progress state updates in the hook to avoid flooding React renders. */
export const PROGRESS_THROTTLE_INTERVAL_MS = 500;

/** Under the 100 a device flow sets: the countdown is ambient and must never sync mid-signing. */
export const UNBONDING_SYNC_PRIORITY = 10;
